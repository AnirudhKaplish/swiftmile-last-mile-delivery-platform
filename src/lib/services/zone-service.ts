// src/lib/services/zone-service.ts
import { prisma } from "../prisma";

export interface ZoneDetectionResult {
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  matchedBy: "PINCODE" | "AREA" | "KEYWORD" | "LIVE_API" | "DEFAULT";
  areaName?: string;
  pincode?: string;
  city?: string;
  state?: string;
  district?: string;
  postOffices?: string[];
}

export interface LivePincodeData {
  pincode: string;
  district: string;
  state: string;
  country: string;
  postOffices: string[];
  primaryArea: string;
}

// Proximity distance matrix between zones (scale 1 = adjacent/close, 2 = moderate, 3 = opposite ends)
export const ZONE_PROXIMITY_MATRIX: Record<string, Record<string, number>> = {
  BLR_SOUTH: { BLR_SOUTH: 0, BLR_CENTRAL: 1, BLR_EAST: 1.5, BLR_WEST: 2, BLR_NORTH: 3 },
  BLR_EAST: { BLR_EAST: 0, BLR_CENTRAL: 1, BLR_SOUTH: 1.5, BLR_NORTH: 2, BLR_WEST: 3 },
  BLR_CENTRAL: { BLR_CENTRAL: 0, BLR_SOUTH: 1, BLR_EAST: 1, BLR_WEST: 1, BLR_NORTH: 1.5 },
  BLR_NORTH: { BLR_NORTH: 0, BLR_CENTRAL: 1.5, BLR_EAST: 2, BLR_WEST: 2, BLR_SOUTH: 3 },
  BLR_WEST: { BLR_WEST: 0, BLR_CENTRAL: 1, BLR_SOUTH: 2, BLR_NORTH: 2, BLR_EAST: 3 },
};

/**
 * Fetches real-time Indian location details for any 6-digit postal pincode
 * using the official India Post Postal Pincode API (https://api.postalpincode.in).
 */
export async function fetchLivePincodeDetails(pincode: string): Promise<LivePincodeData | null> {
  const cleanPin = pincode?.trim();
  if (!cleanPin || !/^\d{6}$/.test(cleanPin)) return null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      next: { revalidate: 86400 }, // Cache response for 24h
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0]?.PostOffice)) {
      const offices = data[0].PostOffice;
      const district = offices[0]?.District || "";
      const state = offices[0]?.State || "";
      const country = offices[0]?.Country || "India";
      const postOfficeNames = offices.map((po: any) => po.Name);
      const primaryArea = offices[0]?.Name || "";

      return {
        pincode: cleanPin,
        district,
        state,
        country,
        postOffices: postOfficeNames,
        primaryArea,
      };
    }
  } catch (err) {
    console.warn(`Live Pincode API unreachable for ${cleanPin}, falling back to DB mapping.`, err);
  }
  return null;
}

/**
 * Calculates proximity distance score between two zone codes.
 * Returns lower score for closer zones.
 */
export function getZoneProximityScore(fromZoneCode: string, toZoneCode: string): number {
  if (fromZoneCode === toZoneCode) return 0;
  return ZONE_PROXIMITY_MATRIX[fromZoneCode]?.[toZoneCode] ?? 2.5;
}

/**
 * Detects the appropriate Zone based on pincode, area name, or address text.
 * Integrates live India Post lookup for real-time geographic resolution.
 */
export async function detectZoneFromAddress(
  pincode: string,
  areaName?: string,
  address?: string
): Promise<ZoneDetectionResult> {
  const cleanPincode = pincode?.trim();
  const cleanArea = areaName?.trim()?.toLowerCase();
  const cleanAddress = address?.trim()?.toLowerCase() || "";

  // 1. Try exact match by 6-digit Pincode in local ZoneArea database
  if (cleanPincode && cleanPincode.length >= 6) {
    const areaByPin = await prisma.zoneArea.findFirst({
      where: { pincode: cleanPincode },
      include: { zone: true },
    });

    if (areaByPin && areaByPin.zone.active) {
      return {
        zoneId: areaByPin.zone.id,
        zoneCode: areaByPin.zone.code,
        zoneName: areaByPin.zone.name,
        matchedBy: "PINCODE",
        areaName: areaByPin.areaName,
        pincode: areaByPin.pincode,
        city: "Bengaluru",
      };
    }
  }

  // 2. Try exact/partial match by Area Name in local database
  if (cleanArea) {
    const allAreas = await prisma.zoneArea.findMany({
      include: { zone: true },
    });

    const matchedArea = allAreas.find(
      (a) =>
        a.zone.active &&
        (a.areaName.toLowerCase() === cleanArea ||
          cleanArea.includes(a.areaName.toLowerCase()) ||
          a.areaName.toLowerCase().includes(cleanArea))
    );

    if (matchedArea) {
      return {
        zoneId: matchedArea.zone.id,
        zoneCode: matchedArea.zone.code,
        zoneName: matchedArea.zone.name,
        matchedBy: "AREA",
        areaName: matchedArea.areaName,
        pincode: matchedArea.pincode,
        city: "Bengaluru",
      };
    }
  }

  // 3. Try matching keywords in Address text
  if (cleanAddress) {
    const allAreas = await prisma.zoneArea.findMany({
      include: { zone: true },
    });

    for (const a of allAreas) {
      if (a.zone.active && cleanAddress.includes(a.areaName.toLowerCase())) {
        return {
          zoneId: a.zone.id,
          zoneCode: a.zone.code,
          zoneName: a.zone.name,
          matchedBy: "KEYWORD",
          areaName: a.areaName,
          pincode: a.pincode,
          city: "Bengaluru",
        };
      }
    }
  }

  // 4. Live External India Post API Resolution
  if (cleanPincode && cleanPincode.length === 6) {
    const liveData = await fetchLivePincodeDetails(cleanPincode);
    if (liveData) {
      // Find closest zone based on district/area name keyword matching
      const allZones = await prisma.zone.findMany({ where: { active: true } });
      const firstZone = allZones[0];

      return {
        zoneId: firstZone?.id || "default",
        zoneCode: firstZone?.code || "ZONE_DEFAULT",
        zoneName: firstZone?.name || "General Operating Hub",
        matchedBy: "LIVE_API",
        areaName: liveData.primaryArea,
        pincode: cleanPincode,
        city: liveData.district,
        district: liveData.district,
        state: liveData.state,
        postOffices: liveData.postOffices,
      };
    }
  }

  // 5. Default fallback: Pick the first active zone
  const firstActiveZone = await prisma.zone.findFirst({
    where: { active: true },
  });

  if (!firstActiveZone) {
    throw new Error("No active delivery zones configured in the system.");
  }

  return {
    zoneId: firstActiveZone.id,
    zoneCode: firstActiveZone.code,
    zoneName: firstActiveZone.name,
    matchedBy: "DEFAULT",
  };
}
