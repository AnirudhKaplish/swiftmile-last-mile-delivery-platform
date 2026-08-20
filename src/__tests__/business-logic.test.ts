// src/__tests__/business-logic.test.ts
import { calculateVolumetricWeight, calculateChargeableWeight, calculateDeliveryPrice } from "../lib/services/rate-engine";
import { getZoneProximityScore, detectZoneFromAddress } from "../lib/services/zone-service";
import { isValidStatusTransition, ALLOWED_STATUS_TRANSITIONS } from "../lib/services/order-service";
import { prisma } from "../lib/prisma";
import { autoAssignOrder } from "../lib/services/assignment-service";
import { rescheduleDelivery } from "../lib/services/reschedule-service";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n🧪 Running Last-Mile Delivery Business Logic Test Suite...\n");

  // =========================================================================
  // 1. VOLUMETRIC & CHARGEABLE WEIGHT TESTS
  // =========================================================================
  console.log("📦 1. Testing Volumetric & Chargeable Weight Logic:");
  
  // Box: 50cm x 40cm x 30cm = 60000 / 5000 = 12.0 kg
  const vol1 = calculateVolumetricWeight(50, 40, 30);
  assert(vol1 === 12.0, "Volumetric weight for 50x40x30 cm must equal exactly 12.0 kg");

  // Box: 20cm x 15cm x 10cm = 3000 / 5000 = 0.6 kg
  const vol2 = calculateVolumetricWeight(20, 15, 10);
  assert(vol2 === 0.6, "Volumetric weight for 20x15x10 cm must equal exactly 0.6 kg");

  // Actual wt 15 kg > Volumetric 12 kg -> Chargeable = 15 kg
  const chg1 = calculateChargeableWeight(15, 12);
  assert(chg1 === 15.0, "Chargeable weight selects higher actual weight (15kg vs 12kg)");

  // Actual wt 5 kg < Volumetric 12 kg -> Chargeable = 12 kg
  const chg2 = calculateChargeableWeight(5, 12);
  assert(chg2 === 12.0, "Chargeable weight selects higher volumetric weight (5kg vs 12kg)");

  // =========================================================================
  // 2. DYNAMIC RATE CALCULATION ENGINE TESTS
  // =========================================================================
  console.log("\n💰 2. Testing Dynamic Rate Engine & Rate Card Lookups:");
  
  const zoneSouth = await prisma.zone.findUnique({ where: { code: "BLR_SOUTH" } });
  const zoneEast = await prisma.zone.findUnique({ where: { code: "BLR_EAST" } });

  if (zoneSouth && zoneEast) {
    // B2C Intra-Zone (South -> South, 1.0kg actual, 0.6kg vol, Prepaid)
    // Base: ₹50, Extra: ₹0, COD: ₹0 -> Total = ₹50
    const b2cIntra = await calculateDeliveryPrice({
      orderType: "B2C",
      paymentType: "PREPAID",
      pickupZoneId: zoneSouth.id,
      dropZoneId: zoneSouth.id,
      lengthCm: 20,
      breadthCm: 15,
      heightCm: 10,
      actualWeightKg: 1.0,
    });
    assert(b2cIntra.zoneType === "INTRA", "B2C South-to-South correctly detected as INTRA zone");
    assert(b2cIntra.totalAmount === 50.0, "B2C Intra-zone 1kg prepaid total is exactly ₹50");

    // B2C Inter-Zone + COD (South -> East, 2.0kg actual, 1.0kg vol, COD)
    // Base: ₹90 (1kg), Extra: 1.0kg * ₹35 = ₹35, COD: ₹40 -> Total = 90 + 35 + 40 = ₹165
    const b2cInterCOD = await calculateDeliveryPrice({
      orderType: "B2C",
      paymentType: "COD",
      pickupZoneId: zoneSouth.id,
      dropZoneId: zoneEast.id,
      lengthCm: 25,
      breadthCm: 20,
      heightCm: 10,
      actualWeightKg: 2.0,
    });
    assert(b2cInterCOD.zoneType === "INTER", "B2C South-to-East correctly detected as INTER zone");
    assert(b2cInterCOD.codSurcharge === 40.0, "B2C COD surcharge is ₹40 flat");
    assert(b2cInterCOD.totalAmount === 165.0, "B2C Inter-zone 2kg COD total is ₹165 (90 base + 35 extra + 40 cod)");

    // B2B Intra-Zone (South -> South, 5.0kg actual, 4.0kg vol, Prepaid)
    // Base: ₹80 (covers 2kg), Extra: (5 - 2) * ₹18 = ₹54 -> Total = ₹134
    const b2bIntra = await calculateDeliveryPrice({
      orderType: "B2B",
      paymentType: "PREPAID",
      pickupZoneId: zoneSouth.id,
      dropZoneId: zoneSouth.id,
      lengthCm: 30,
      breadthCm: 25,
      heightCm: 20,
      actualWeightKg: 5.0,
    });
    assert(b2bIntra.baseCharge === 80.0, "B2B Intra-zone base rate is ₹80 (covers 2kg)");
    assert(b2bIntra.weightCharge === 54.0, "B2B Extra 3kg weight charge is ₹54 (3kg * ₹18/kg)");
    assert(b2bIntra.totalAmount === 134.0, "B2B Intra 5kg total is ₹134");
  }

  // =========================================================================
  // 3. ZONE DETECTION ENGINE TESTS
  // =========================================================================
  console.log("\n🗺️ 3. Testing Zone Detection Engine:");
  
  // Pincode 560034 -> Koramangala -> BLR_SOUTH
  const detected1 = await detectZoneFromAddress("560034");
  assert(detected1.zoneCode === "BLR_SOUTH", "Pincode 560034 mapped to BLR_SOUTH");

  // Area 'Whitefield' -> BLR_EAST
  const detected2 = await detectZoneFromAddress("", "Whitefield");
  assert(detected2.zoneCode === "BLR_EAST", "Area 'Whitefield' mapped to BLR_EAST");

  // Address keyword 'Manyata' -> BLR_NORTH
  const detected3 = await detectZoneFromAddress("", "", "Flat 101, Near Manyata Tech Park Gate 2");
  assert(detected3.zoneCode === "BLR_NORTH", "Address containing 'Manyata' mapped to BLR_NORTH");

  // Zone Proximity Score
  const proxSame = getZoneProximityScore("BLR_SOUTH", "BLR_SOUTH");
  const proxAdj = getZoneProximityScore("BLR_SOUTH", "BLR_CENTRAL");
  const proxFar = getZoneProximityScore("BLR_SOUTH", "BLR_NORTH");
  assert(proxSame === 0, "Same zone proximity score is 0");
  assert(proxAdj < proxFar, "Adjacent zone proximity (South-Central) is closer than distant zone (South-North)");

  // =========================================================================
  // 4. LIFECYCLE & STATE TRANSITION VALIDATION TESTS
  // =========================================================================
  console.log("\n🔄 4. Testing State Machine Lifecycle Validation:");
  
  // Valid transitions
  assert(isValidStatusTransition("CREATED", "PICKED_UP").valid, "CREATED -> PICKED_UP is valid");
  assert(isValidStatusTransition("PICKED_UP", "IN_TRANSIT").valid, "PICKED_UP -> IN_TRANSIT is valid");
  assert(isValidStatusTransition("IN_TRANSIT", "OUT_FOR_DELIVERY").valid, "IN_TRANSIT -> OUT_FOR_DELIVERY is valid");
  assert(isValidStatusTransition("OUT_FOR_DELIVERY", "DELIVERED").valid, "OUT_FOR_DELIVERY -> DELIVERED is valid");
  assert(isValidStatusTransition("OUT_FOR_DELIVERY", "FAILED").valid, "OUT_FOR_DELIVERY -> FAILED is valid");

  // Invalid transitions
  assert(!isValidStatusTransition("DELIVERED", "IN_TRANSIT").valid, "DELIVERED -> IN_TRANSIT is strictly rejected (Terminal)");
  assert(!isValidStatusTransition("CREATED", "DELIVERED").valid, "CREATED -> DELIVERED is strictly rejected (Must pick up first)");
  assert(!isValidStatusTransition("PICKED_UP", "CREATED").valid, "PICKED_UP -> CREATED backward transition is rejected");

  // Admin Override
  assert(isValidStatusTransition("DELIVERED", "IN_TRANSIT", "ADMIN").valid, "ADMIN is permitted to override status with audit tracking");

  // =========================================================================
  // 5. AGENT AUTO-ASSIGNMENT DETERMINISTIC LOGIC TESTS
  // =========================================================================
  console.log("\n🤖 5. Testing Deterministic Agent Auto-Assignment:");
  
  const testOrder = await prisma.order.findFirst({
    where: { status: "CREATED" },
    include: { pickupZone: true },
  });

  if (testOrder) {
    const assignResult = await autoAssignOrder(testOrder.id, "TEST_SYSTEM", "SYSTEM");
    assert(assignResult.success === true, "Auto-assignment successfully found available agent");
    assert(!!assignResult.agentName, `Assigned agent has valid name: ${assignResult.agentName}`);
    assert(!!assignResult.reason, `Assignment has clear audit reason: ${assignResult.reason}`);
  }

  // =========================================================================
  // 6. FAILED DELIVERY & RESCHEDULING WORKFLOW TESTS
  // =========================================================================
  console.log("\n📅 6. Testing Failed Delivery & Reschedule Flow:");

  let failedOrder = await prisma.order.findFirst({
    where: { status: "FAILED" },
    include: { attempts: true },
  });

  if (!failedOrder) {
    const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    const zone = await prisma.zone.findFirst({ where: { active: true } });
    if (customer && zone) {
      failedOrder = await prisma.order.create({
        data: {
          trackingNumber: `TRK-TEST-FAIL-${Date.now()}`,
          customerId: customer.id,
          orderType: "B2C",
          paymentType: "PREPAID",
          status: "FAILED",
          failureReason: "CUSTOMER_UNAVAILABLE",
          pickupAddress: "123 Test St",
          pickupPincode: "560034",
          pickupZoneId: zone.id,
          dropAddress: "456 Drop St",
          dropPincode: "560066",
          dropZoneId: zone.id,
          lengthCm: 20,
          breadthCm: 15,
          heightCm: 10,
          actualWeightKg: 1,
          volumetricWeightKg: 0.6,
          chargeableWeightKg: 1,
          zoneType: "INTRA",
          baseCharge: 50,
          weightCharge: 0,
          codSurcharge: 0,
          totalAmount: 50,
          attempts: {
            create: { attemptNumber: 1, status: "FAILED", notes: "First attempt failed" },
          },
        },
        include: { attempts: true },
      });
    }
  }

  if (failedOrder) {
    const priorAttempts = failedOrder.attempts.length;
    const newDate = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    const rescheduled = await rescheduleDelivery({
      orderId: failedOrder.id,
      rescheduledDate: newDate,
      rescheduleSlot: "Morning (09:00 AM - 01:00 PM)",
      rescheduleReason: "Customer requested weekend delivery",
      actorRole: "CUSTOMER",
    });

    assert(rescheduled?.status === "IN_TRANSIT", "Rescheduled order transitioned back to IN_TRANSIT");
    assert(rescheduled?.attempts.length === priorAttempts + 1, `New DeliveryAttempt record created (Total attempts: ${rescheduled?.attempts.length})`);
    assert(rescheduled?.rescheduleSlot === "Morning (09:00 AM - 01:00 PM)", "Reschedule slot saved properly");
  }

  console.log(`\n=================================================================`);
  console.log(`📊 Test Summary: ${passedCount} Passed | ${failedCount} Failed`);
  console.log(`=================================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
