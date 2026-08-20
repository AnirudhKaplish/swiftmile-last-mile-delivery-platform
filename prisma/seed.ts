// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Last-Mile Delivery Platform database seed...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.trackingEvent.deleteMany();
  await prisma.deliveryAttempt.deleteMany();
  await prisma.deliveryAssignment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.zoneArea.deleteMany();
  await prisma.agentProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("adminpassword123", 10);

  // 1. Create Zones
  console.log("Creating Zones & Areas...");
  const zoneSouth = await prisma.zone.create({
    data: {
      code: "BLR_SOUTH",
      name: "Bengaluru South Zone",
      city: "Bengaluru",
      state: "Karnataka",
      active: true,
      areas: {
        create: [
          { areaName: "Koramangala", pincode: "560034" },
          { areaName: "HSR Layout", pincode: "560102" },
          { areaName: "BTM Layout", pincode: "560068" },
          { areaName: "Jayanagar", pincode: "560041" },
          { areaName: "JP Nagar", pincode: "560078" },
          { areaName: "Electronic City", pincode: "560100" },
        ],
      },
    },
  });

  const zoneEast = await prisma.zone.create({
    data: {
      code: "BLR_EAST",
      name: "Bengaluru East Zone",
      city: "Bengaluru",
      state: "Karnataka",
      active: true,
      areas: {
        create: [
          { areaName: "Indiranagar", pincode: "560038" },
          { areaName: "Whitefield", pincode: "560066" },
          { areaName: "Marathahalli", pincode: "560037" },
          { areaName: "Bellandur", pincode: "560103" },
          { areaName: "HAL Old Airport", pincode: "560017" },
        ],
      },
    },
  });

  const zoneNorth = await prisma.zone.create({
    data: {
      code: "BLR_NORTH",
      name: "Bengaluru North Zone",
      city: "Bengaluru",
      state: "Karnataka",
      active: true,
      areas: {
        create: [
          { areaName: "Hebbal", pincode: "560024" },
          { areaName: "Yelahanka", pincode: "560064" },
          { areaName: "Manyata Tech Park", pincode: "560045" },
          { areaName: "RT Nagar", pincode: "560032" },
        ],
      },
    },
  });

  const zoneCentral = await prisma.zone.create({
    data: {
      code: "BLR_CENTRAL",
      name: "Bengaluru Central Zone",
      city: "Bengaluru",
      state: "Karnataka",
      active: true,
      areas: {
        create: [
          { areaName: "MG Road", pincode: "560001" },
          { areaName: "Richmond Town", pincode: "560025" },
          { areaName: "Shivajinagar", pincode: "560051" },
          { areaName: "Malleshwaram", pincode: "560003" },
          { areaName: "Rajajinagar", pincode: "560010" },
        ],
      },
    },
  });

  // 2. Create Rate Cards
  console.log("Creating Rate Cards...");
  const b2cRateCard = await prisma.rateCard.create({
    data: {
      name: "Standard B2C Retail Rate Card",
      orderType: "B2C",
      intraZoneBaseRate: 50.0,
      intraZoneExtraPerKg: 25.0,
      interZoneBaseRate: 90.0,
      interZoneExtraPerKg: 35.0,
      baseWeightKg: 1.0,
      codSurcharge: 40.0,
      active: true,
    },
  });

  const b2bRateCard = await prisma.rateCard.create({
    data: {
      name: "Enterprise B2B Commercial Rate Card",
      orderType: "B2B",
      intraZoneBaseRate: 80.0,
      intraZoneExtraPerKg: 18.0,
      interZoneBaseRate: 140.0,
      interZoneExtraPerKg: 25.0,
      baseWeightKg: 2.0,
      codSurcharge: 50.0,
      active: true,
    },
  });

  // 3. Create Admin User
  console.log("Creating Admin User...");
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@swiftmile.in",
      passwordHash: adminPasswordHash,
      name: "Rajesh Sharma (Operations Head)",
      phone: "+91 98450 12345",
      role: "ADMIN",
    },
  });

  // 4. Create Delivery Agents
  console.log("Creating Delivery Agents...");
  const agentData = [
    {
      name: "Vikram Singh",
      email: "vikram.agent@swiftmile.in",
      phone: "+91 98765 43210",
      vehicleType: "Motorcycle (Hero Splendor)",
      vehicleNumber: "KA-01-EA-1011",
      zoneId: zoneSouth.id,
      status: "AVAILABLE",
      rating: 4.9,
    },
    {
      name: "Arjun Gowda",
      email: "arjun.agent@swiftmile.in",
      phone: "+91 98765 43211",
      vehicleType: "Electric Scooter (Ather 450X)",
      vehicleNumber: "KA-05-MK-2022",
      zoneId: zoneEast.id,
      status: "AVAILABLE",
      rating: 4.8,
    },
    {
      name: "Suresh Kumar",
      email: "suresh.agent@swiftmile.in",
      phone: "+91 98765 43212",
      vehicleType: "Scooter (Honda Activa)",
      vehicleNumber: "KA-03-JN-3033",
      zoneId: zoneNorth.id,
      status: "AVAILABLE",
      rating: 4.7,
    },
    {
      name: "Ramesh Babu",
      email: "ramesh.agent@swiftmile.in",
      phone: "+91 98765 43213",
      vehicleType: "Electric Van (Tata Ace EV)",
      vehicleNumber: "KA-04-EV-4044",
      zoneId: zoneCentral.id,
      status: "AVAILABLE",
      rating: 4.9,
    },
    {
      name: "Mohammed Farooq",
      email: "farooq.agent@swiftmile.in",
      phone: "+91 98765 43214",
      vehicleType: "Motorcycle (Bajaj Pulsar)",
      vehicleNumber: "KA-51-AB-5055",
      zoneId: zoneSouth.id,
      status: "AVAILABLE",
      rating: 4.6,
    },
    {
      name: "Praveen Hegde",
      email: "praveen.agent@swiftmile.in",
      phone: "+91 98765 43215",
      vehicleType: "Mini Truck (Mahindra Bolero Maxi)",
      vehicleNumber: "KA-02-TR-6066",
      zoneId: zoneEast.id,
      status: "BUSY",
      rating: 4.8,
    },
    {
      name: "Kiran Reddy",
      email: "kiran.agent@swiftmile.in",
      phone: "+91 98765 43216",
      vehicleType: "Motorcycle (TVS Raider)",
      vehicleNumber: "KA-01-XY-7077",
      zoneId: zoneNorth.id,
      status: "AVAILABLE",
      rating: 4.7,
    },
    {
      name: "Deepak Verma",
      email: "deepak.agent@swiftmile.in",
      phone: "+91 98765 43217",
      vehicleType: "Scooter (TVS Jupiter)",
      vehicleNumber: "KA-04-PQ-8088",
      zoneId: zoneCentral.id,
      status: "OFFLINE",
      rating: 4.5,
    },
  ];

  const createdAgents: any[] = [];
  for (const a of agentData) {
    const user = await prisma.user.create({
      data: {
        email: a.email,
        passwordHash: defaultPasswordHash,
        name: a.name,
        phone: a.phone,
        role: "DELIVERY_AGENT",
        agentProfile: {
          create: {
            vehicleType: a.vehicleType,
            vehicleNumber: a.vehicleNumber,
            currentZoneId: a.zoneId,
            status: a.status,
            rating: a.rating,
          },
        },
      },
      include: { agentProfile: true },
    });
    createdAgents.push(user);
  }

  // 5. Create Customers
  console.log("Creating Customers...");
  const customerData = [
    { name: "Ananya Deshmukh", email: "ananya.customer@gmail.com", phone: "+91 98451 11001", company: null },
    { name: "Rohan Mehta", email: "rohan.mehta@outlook.com", phone: "+91 98451 11002", company: null },
    { name: "Pooja Nair", email: "pooja.nair@yahoo.com", phone: "+91 98451 11003", company: null },
    { name: "Karthik Iyer", email: "karthik.iyer@gmail.com", phone: "+91 98451 11004", company: null },
    { name: "Zenith Electronics Pvt Ltd", email: "logistics@zenithelec.in", phone: "+91 80 4123 9000", company: "Zenith Electronics Pvt Ltd", gstin: "29AABCZ1234F1Z8" },
    { name: "UrbanKraft Furniture Studio", email: "dispatch@urbankraft.in", phone: "+91 80 4987 6543", company: "UrbanKraft Furniture Studio", gstin: "29AADCU8765G1Z2" },
    { name: "FreshRoots Organics", email: "orders@freshroots.in", phone: "+91 98451 11007", company: "FreshRoots Organics LLP", gstin: "29ABEFF4433E1Z4" },
    { name: "Sneha Patel", email: "sneha.patel@gmail.com", phone: "+91 98451 11008", company: null },
    { name: "Amitabh Sen", email: "amitabh.sen@rediffmail.com", phone: "+91 98451 11009", company: null },
    { name: "Divya Krishnan", email: "divya.k@gmail.com", phone: "+91 98451 11010", company: null },
  ];

  const createdCustomers: any[] = [];
  for (const c of customerData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: defaultPasswordHash,
        name: c.name,
        phone: c.phone,
        role: "CUSTOMER",
        customerProfile: {
          create: {
            companyName: c.company,
            gstin: c.gstin,
            city: "Bengaluru",
          },
        },
      },
    });
    createdCustomers.push(user);
  }

  // 6. Create Seed Orders across all lifecycle states
  console.log("Creating Seed Orders and Tracking Histories...");
  const primaryCustomer = createdCustomers[0]; // Ananya
  const primaryAgent = createdAgents[0]; // Vikram Singh

  // Order 1: Active OUT_FOR_DELIVERY (Ananya, Koramangala to Whitefield, Prepaid)
  const order1 = await prisma.order.create({
    data: {
      trackingNumber: "TRK-IN-2026-10492",
      customerId: primaryCustomer.id,
      orderType: "B2C",
      paymentType: "PREPAID",
      status: "OUT_FOR_DELIVERY",
      pickupAddress: "Flat 402, Prestige Oasis, 4th Block, Koramangala",
      pickupPincode: "560034",
      pickupArea: "Koramangala",
      pickupCity: "Bengaluru",
      pickupZoneId: zoneSouth.id,
      dropAddress: "Villa 12, Palm Meadows, Outer Ring Road, Whitefield",
      dropPincode: "560066",
      dropArea: "Whitefield",
      dropCity: "Bengaluru",
      dropZoneId: zoneEast.id,
      lengthCm: 30.0,
      breadthCm: 20.0,
      heightCm: 15.0,
      actualWeightKg: 1.5,
      volumetricWeightKg: 1.8,
      chargeableWeightKg: 1.8,
      zoneType: "INTER",
      baseCharge: 90.0,
      weightCharge: 28.0,
      codSurcharge: 0.0,
      totalAmount: 118.0,
      assignedAgentId: primaryAgent.agentProfile.id,
      assignedAgentName: primaryAgent.name,
      assignedAgentPhone: primaryAgent.phone,
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      trackingEvents: {
        create: [
          {
            previousStatus: null,
            newStatus: "CREATED",
            timestamp: new Date(Date.now() - 4 * 3600 * 1000),
            actorId: primaryCustomer.id,
            actorRole: "CUSTOMER",
            location: "Koramangala Hub",
            notes: "Order confirmed by customer. Chargeable weight 1.8kg (Inter-Zone)",
          },
          {
            previousStatus: "CREATED",
            newStatus: "PICKED_UP",
            timestamp: new Date(Date.now() - 3 * 3600 * 1000),
            actorId: primaryAgent.id,
            actorRole: "DELIVERY_AGENT",
            location: "Koramangala 4th Block",
            notes: "Package securely picked up from Prestige Oasis by Vikram Singh",
          },
          {
            previousStatus: "PICKED_UP",
            newStatus: "IN_TRANSIT",
            timestamp: new Date(Date.now() - 2 * 3600 * 1000),
            actorId: primaryAgent.id,
            actorRole: "DELIVERY_AGENT",
            location: "Koramangala-Whitefield Express Corridor",
            notes: "Shipment departed transit sorting center",
          },
          {
            previousStatus: "IN_TRANSIT",
            newStatus: "OUT_FOR_DELIVERY",
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            actorId: primaryAgent.id,
            actorRole: "DELIVERY_AGENT",
            location: "Whitefield Hub",
            notes: "Vikram Singh is out for delivery. Estimated arrival in 30 mins.",
          },
        ],
      },
      assignments: {
        create: {
          agentId: primaryAgent.agentProfile.id,
          active: true,
          reason: "Auto-assigned: Best zone match & lowest workload",
        },
      },
      attempts: {
        create: {
          attemptNumber: 1,
          status: "OUT_FOR_DELIVERY",
          notes: "Attempt 1 in progress",
        },
      },
    },
  });

  // Order 2: FAILED & Needs Rescheduling (Ananya, BTM to Indiranagar, COD)
  const order2 = await prisma.order.create({
    data: {
      trackingNumber: "TRK-IN-2026-88319",
      customerId: primaryCustomer.id,
      orderType: "B2C",
      paymentType: "COD",
      status: "FAILED",
      pickupAddress: "No. 88, 7th Main, BTM 2nd Stage",
      pickupPincode: "560068",
      pickupArea: "BTM Layout",
      pickupCity: "Bengaluru",
      pickupZoneId: zoneSouth.id,
      dropAddress: "100 Feet Road, HAL 2nd Stage, Indiranagar",
      dropPincode: "560038",
      dropArea: "Indiranagar",
      dropCity: "Bengaluru",
      dropZoneId: zoneEast.id,
      lengthCm: 25.0,
      breadthCm: 20.0,
      heightCm: 10.0,
      actualWeightKg: 0.8,
      volumetricWeightKg: 1.0,
      chargeableWeightKg: 1.0,
      zoneType: "INTER",
      baseCharge: 90.0,
      weightCharge: 0.0,
      codSurcharge: 40.0,
      totalAmount: 130.0,
      failureReason: "CUSTOMER_UNAVAILABLE",
      failureNotes: "Customer phone switched off upon 3 doorstep attempts",
      assignedAgentId: createdAgents[1].agentProfile.id,
      assignedAgentName: createdAgents[1].name,
      assignedAgentPhone: createdAgents[1].phone,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      trackingEvents: {
        create: [
          {
            previousStatus: null,
            newStatus: "CREATED",
            timestamp: new Date(Date.now() - 24 * 3600 * 1000),
            actorId: primaryCustomer.id,
            actorRole: "CUSTOMER",
            notes: "COD order placed. ₹130 cash due on delivery.",
          },
          {
            previousStatus: "CREATED",
            newStatus: "PICKED_UP",
            timestamp: new Date(Date.now() - 20 * 3600 * 1000),
            actorId: createdAgents[1].id,
            actorRole: "DELIVERY_AGENT",
            notes: "Picked up by Arjun Gowda",
          },
          {
            previousStatus: "PICKED_UP",
            newStatus: "OUT_FOR_DELIVERY",
            timestamp: new Date(Date.now() - 16 * 3600 * 1000),
            actorId: createdAgents[1].id,
            actorRole: "DELIVERY_AGENT",
            notes: "Arjun Gowda out for delivery",
          },
          {
            previousStatus: "OUT_FOR_DELIVERY",
            newStatus: "FAILED",
            timestamp: new Date(Date.now() - 14 * 3600 * 1000),
            actorId: createdAgents[1].id,
            actorRole: "DELIVERY_AGENT",
            notes: "Failed: Customer Unavailable / Phone Unreachable. Notes: Customer phone switched off",
          },
        ],
      },
      attempts: {
        create: {
          attemptNumber: 1,
          status: "FAILED",
          failureReason: "CUSTOMER_UNAVAILABLE",
          notes: "Doorstep bell unanswered, phone unreachable.",
        },
      },
    },
  });

  // Order 3: Rescheduled Order (Rohan Mehta, JP Nagar to Jayanagar, Intra-Zone, Prepaid)
  const order3 = await prisma.order.create({
    data: {
      trackingNumber: "TRK-IN-2026-64218",
      customerId: createdCustomers[1].id,
      orderType: "B2C",
      paymentType: "PREPAID",
      status: "IN_TRANSIT",
      pickupAddress: "House 54, 15th Cross, JP Nagar 3rd Phase",
      pickupPincode: "560078",
      pickupArea: "JP Nagar",
      pickupCity: "Bengaluru",
      pickupZoneId: zoneSouth.id,
      dropAddress: "Shop 11, 4th Block Complex, Jayanagar",
      dropPincode: "560041",
      dropArea: "Jayanagar",
      dropCity: "Bengaluru",
      dropZoneId: zoneSouth.id,
      lengthCm: 20.0,
      breadthCm: 15.0,
      heightCm: 10.0,
      actualWeightKg: 0.5,
      volumetricWeightKg: 0.6,
      chargeableWeightKg: 0.6,
      zoneType: "INTRA",
      baseCharge: 50.0,
      weightCharge: 0.0,
      codSurcharge: 0.0,
      totalAmount: 50.0,
      assignedAgentId: primaryAgent.agentProfile.id,
      assignedAgentName: primaryAgent.name,
      assignedAgentPhone: primaryAgent.phone,
      rescheduledDate: new Date(Date.now() + 24 * 3600 * 1000),
      rescheduleSlot: "Morning (09:00 AM - 01:00 PM)",
      rescheduleReason: "Customer was travelling on previous day",
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      trackingEvents: {
        create: [
          {
            previousStatus: null,
            newStatus: "CREATED",
            timestamp: new Date(Date.now() - 48 * 3600 * 1000),
            actorRole: "CUSTOMER",
            notes: "Order placed for intra-zone delivery (₹50)",
          },
          {
            previousStatus: "CREATED",
            newStatus: "OUT_FOR_DELIVERY",
            timestamp: new Date(Date.now() - 36 * 3600 * 1000),
            actorRole: "DELIVERY_AGENT",
            notes: "Out for delivery attempt 1",
          },
          {
            previousStatus: "OUT_FOR_DELIVERY",
            newStatus: "FAILED",
            timestamp: new Date(Date.now() - 30 * 3600 * 1000),
            actorRole: "DELIVERY_AGENT",
            notes: "Failed: Customer Unavailable",
          },
          {
            previousStatus: "FAILED",
            newStatus: "IN_TRANSIT",
            timestamp: new Date(Date.now() - 10 * 3600 * 1000),
            actorRole: "CUSTOMER",
            notes: "Delivery Rescheduled to tomorrow [Morning]. Reason: Customer was travelling. Attempt #2 logged.",
          },
        ],
      },
      attempts: {
        create: [
          { attemptNumber: 1, status: "FAILED", failureReason: "CUSTOMER_UNAVAILABLE" },
          { attemptNumber: 2, status: "IN_TRANSIT", notes: "Rescheduled for tomorrow morning" },
        ],
      },
    },
  });

  // Order 4: DELIVERED (Zenith Electronics, B2B, Electronic City to Manyata Tech Park)
  const order4 = await prisma.order.create({
    data: {
      trackingNumber: "TRK-IN-2026-90214",
      customerId: createdCustomers[4].id, // Zenith
      orderType: "B2B",
      paymentType: "PREPAID",
      status: "DELIVERED",
      pickupAddress: "Tower B, Cyber Park, Phase 1, Electronic City",
      pickupPincode: "560100",
      pickupArea: "Electronic City",
      pickupCity: "Bengaluru",
      pickupZoneId: zoneSouth.id,
      dropAddress: "Block N1, Manyata Embassy Business Park, Nagavara",
      dropPincode: "560045",
      dropArea: "Manyata Tech Park",
      dropCity: "Bengaluru",
      dropZoneId: zoneNorth.id,
      lengthCm: 60.0,
      breadthCm: 40.0,
      heightCm: 30.0,
      actualWeightKg: 8.5,
      volumetricWeightKg: 14.4,
      chargeableWeightKg: 14.4,
      zoneType: "INTER",
      baseCharge: 140.0,
      weightCharge: 310.0, // (14.4 - 2.0) = 12.4 * 25 = 310
      codSurcharge: 0.0,
      totalAmount: 450.0,
      assignedAgentId: createdAgents[3].agentProfile.id,
      assignedAgentName: createdAgents[3].name,
      assignedAgentPhone: createdAgents[3].phone,
      createdAt: new Date(Date.now() - 30 * 3600 * 1000),
      trackingEvents: {
        create: [
          {
            previousStatus: null,
            newStatus: "CREATED",
            timestamp: new Date(Date.now() - 30 * 3600 * 1000),
            actorRole: "CUSTOMER",
            notes: "B2B Commercial Shipment created. Chargeable weight 14.4kg (₹450)",
          },
          {
            previousStatus: "CREATED",
            newStatus: "PICKED_UP",
            timestamp: new Date(Date.now() - 25 * 3600 * 1000),
            actorRole: "DELIVERY_AGENT",
            notes: "Cargo loaded into Electric Van KA-04-EV-4044",
          },
          {
            previousStatus: "PICKED_UP",
            newStatus: "IN_TRANSIT",
            timestamp: new Date(Date.now() - 20 * 3600 * 1000),
            actorRole: "DELIVERY_AGENT",
            notes: "Transit via Outer Ring Road",
          },
          {
            previousStatus: "IN_TRANSIT",
            newStatus: "OUT_FOR_DELIVERY",
            timestamp: new Date(Date.now() - 8 * 3600 * 1000),
            actorRole: "DELIVERY_AGENT",
            notes: "Arrived at Manyata Tech Park security gate",
          },
          {
            previousStatus: "OUT_FOR_DELIVERY",
            newStatus: "DELIVERED",
            timestamp: new Date(Date.now() - 2 * 3600 * 1000),
            actorRole: "DELIVERY_AGENT",
            notes: "Delivered to Main Receiving Bay. Signed by Security In-charge.",
          },
        ],
      },
      attempts: {
        create: { attemptNumber: 1, status: "DELIVERED", notes: "Delivered on first attempt" },
      },
    },
  });

  // Create 16 more diverse orders across all zones and statuses
  const extraOrderSpecs = [
    { cust: 0, fromZ: zoneSouth, fromArea: "HSR Layout", toZ: zoneCentral, toArea: "MG Road", type: "B2C", pay: "PREPAID", status: "CREATED", wt: 2.0, l: 30, b: 20, h: 10, total: 125 },
    { cust: 1, fromZ: zoneEast, fromArea: "Whitefield", toZ: zoneEast, toArea: "Indiranagar", type: "B2C", pay: "COD", status: "PICKED_UP", wt: 1.2, l: 20, b: 15, h: 10, total: 95 },
    { cust: 2, fromZ: zoneNorth, fromArea: "Hebbal", toZ: zoneNorth, toArea: "Yelahanka", type: "B2C", pay: "PREPAID", status: "IN_TRANSIT", wt: 0.9, l: 15, b: 10, h: 10, total: 50 },
    { cust: 3, fromZ: zoneCentral, fromArea: "Malleshwaram", toZ: zoneSouth, toArea: "Koramangala", type: "B2C", pay: "COD", status: "OUT_FOR_DELIVERY", wt: 3.5, l: 35, b: 25, h: 15, total: 217.5 },
    { cust: 4, fromZ: zoneSouth, fromArea: "Electronic City", toZ: zoneEast, toArea: "Whitefield", type: "B2B", pay: "PREPAID", status: "DELIVERED", wt: 12.0, l: 50, b: 40, h: 30, total: 390 },
    { cust: 5, fromZ: zoneEast, fromArea: "Bellandur", toZ: zoneCentral, toArea: "Richmond Town", type: "B2B", pay: "PREPAID", status: "CREATED", wt: 6.0, l: 40, b: 30, h: 20, total: 240 },
    { cust: 6, fromZ: zoneNorth, fromArea: "Manyata Tech Park", toZ: zoneSouth, toArea: "JP Nagar", type: "B2B", pay: "COD", status: "PICKED_UP", wt: 4.5, l: 35, b: 30, h: 20, total: 252.5 },
    { cust: 7, fromZ: zoneCentral, fromArea: "Shivajinagar", toZ: zoneCentral, toArea: "Rajajinagar", type: "B2C", pay: "PREPAID", status: "DELIVERED", wt: 1.0, l: 20, b: 15, h: 5, total: 50 },
    { cust: 8, fromZ: zoneSouth, fromArea: "Jayanagar", toZ: zoneEast, toArea: "Marathahalli", type: "B2C", pay: "COD", status: "FAILED", wt: 2.2, l: 25, b: 20, h: 15, total: 172 },
    { cust: 9, fromZ: zoneNorth, fromArea: "RT Nagar", toZ: zoneNorth, toArea: "Hebbal", type: "B2C", pay: "PREPAID", status: "DELIVERED", wt: 0.5, l: 15, b: 10, h: 5, total: 50 },
    { cust: 0, fromZ: zoneEast, fromArea: "HAL Old Airport", toZ: zoneSouth, toArea: "BTM Layout", type: "B2C", pay: "PREPAID", status: "IN_TRANSIT", wt: 1.8, l: 25, b: 20, h: 10, total: 118 },
    { cust: 1, fromZ: zoneSouth, fromArea: "Koramangala", toZ: zoneNorth, toArea: "Manyata Tech Park", type: "B2C", pay: "COD", status: "OUT_FOR_DELIVERY", wt: 2.5, l: 30, b: 25, h: 15, total: 182.5 },
    { cust: 2, fromZ: zoneCentral, fromArea: "MG Road", toZ: zoneEast, toArea: "Whitefield", type: "B2C", pay: "PREPAID", status: "DELIVERED", wt: 1.0, l: 20, b: 20, h: 10, total: 90 },
    { cust: 3, fromZ: zoneSouth, fromArea: "JP Nagar", toZ: zoneSouth, toArea: "HSR Layout", type: "B2C", pay: "COD", status: "DELIVERED", wt: 0.8, l: 15, b: 15, h: 10, total: 90 },
    { cust: 4, fromZ: zoneSouth, fromArea: "Electronic City", toZ: zoneCentral, toArea: "Malleshwaram", type: "B2B", pay: "PREPAID", status: "DELIVERED", wt: 20.0, l: 60, b: 50, h: 40, total: 590 },
    { cust: 5, fromZ: zoneEast, fromArea: "Whitefield", toZ: zoneSouth, toArea: "Koramangala", type: "B2B", pay: "PREPAID", status: "OUT_FOR_DELIVERY", wt: 15.0, l: 55, b: 45, h: 30, total: 465 },
  ];

  for (let i = 0; i < extraOrderSpecs.length; i++) {
    const spec = extraOrderSpecs[i];
    const customer = createdCustomers[spec.cust];
    const isIntra = spec.fromZ.id === spec.toZ.id;
    const volWt = (spec.l * spec.b * spec.h) / 5000;
    const chgWt = Math.max(spec.wt, volWt);
    const assignedAgent = createdAgents[i % createdAgents.length];

    await prisma.order.create({
      data: {
        trackingNumber: `TRK-IN-2026-${70000 + i}`,
        customerId: customer.id,
        orderType: spec.type,
        paymentType: spec.pay,
        status: spec.status,
        pickupAddress: `Site Office, ${spec.fromArea}`,
        pickupPincode: "560000",
        pickupArea: spec.fromArea,
        pickupCity: "Bengaluru",
        pickupZoneId: spec.fromZ.id,
        dropAddress: `Customer Facility, ${spec.toArea}`,
        dropPincode: "560000",
        dropArea: spec.toArea,
        dropCity: "Bengaluru",
        dropZoneId: spec.toZ.id,
        lengthCm: spec.l,
        breadthCm: spec.b,
        heightCm: spec.h,
        actualWeightKg: spec.wt,
        volumetricWeightKg: volWt,
        chargeableWeightKg: chgWt,
        zoneType: isIntra ? "INTRA" : "INTER",
        baseCharge: isIntra ? 50.0 : 90.0,
        weightCharge: spec.total > 100 ? spec.total - 100 : 0,
        codSurcharge: spec.pay === "COD" ? 40.0 : 0.0,
        totalAmount: spec.total,
        assignedAgentId: assignedAgent.agentProfile.id,
        assignedAgentName: assignedAgent.name,
        assignedAgentPhone: assignedAgent.phone,
        failureReason: spec.status === "FAILED" ? "CUSTOMER_REJECTED" : null,
        failureNotes: spec.status === "FAILED" ? "Customer requested cancellation at delivery location" : null,
        createdAt: new Date(Date.now() - (i + 1) * 3 * 3600 * 1000),
        trackingEvents: {
          create: [
            {
              previousStatus: null,
              newStatus: "CREATED",
              timestamp: new Date(Date.now() - (i + 1) * 3 * 3600 * 1000),
              actorRole: "CUSTOMER",
              notes: `Order created (${spec.type}, ${spec.pay}, ₹${spec.total})`,
            },
            {
              previousStatus: "CREATED",
              newStatus: spec.status,
              timestamp: new Date(Date.now() - i * 3600 * 1000),
              actorRole: "DELIVERY_AGENT",
              notes: `Updated to ${spec.status}`,
            },
          ],
        },
        attempts: {
          create: {
            attemptNumber: 1,
            status: spec.status,
            notes: `Attempt recorded as ${spec.status}`,
          },
        },
      },
    });
  }

  // Update activeDeliveries count on agents
  for (const agent of createdAgents) {
    const activeCount = await prisma.order.count({
      where: {
        assignedAgentId: agent.agentProfile.id,
        status: { in: ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
      },
    });
    await prisma.agentProfile.update({
      where: { id: agent.agentProfile.id },
      data: { activeDeliveries: activeCount },
    });
  }

  // 7. Seed Notifications for Customer
  console.log("Creating Seed Notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: primaryCustomer.id,
        orderId: order1.id,
        title: "Out For Delivery",
        message: `Agent Vikram Singh is out for delivery with shipment #${order1.trackingNumber}.`,
        type: "STATUS_UPDATE",
        read: false,
      },
      {
        userId: primaryCustomer.id,
        orderId: order2.id,
        title: "Delivery Attempt Failed",
        message: `Delivery attempt for #${order2.trackingNumber} failed (Customer Unavailable). Please click here to reschedule a convenient delivery slot.`,
        type: "DELIVERY_FAILED",
        read: false,
      },
      {
        userId: primaryCustomer.id,
        orderId: order1.id,
        title: "Agent Assigned",
        message: `Agent Vikram Singh (Motorcycle KA-01-EA-1011) has been assigned to your shipment #${order1.trackingNumber}.`,
        type: "AGENT_ASSIGNED",
        read: true,
      },
    ],
  });

  console.log("\n✅ Database seeded successfully!");
  console.log("-----------------------------------------------------------------");
  console.log("👤 Demo Personas:");
  console.log("  • Admin:    admin@swiftmile.in     | Password: adminpassword123");
  console.log("  • Agent:    vikram.agent@swiftmile.in | Password: password123");
  console.log("  • Customer: ananya.customer@gmail.com | Password: password123");
  console.log("-----------------------------------------------------------------\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
