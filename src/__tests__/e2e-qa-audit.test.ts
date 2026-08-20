// src/__tests__/e2e-qa-audit.test.ts
import { prisma } from "../lib/prisma";
import { calculateDeliveryPrice, calculateVolumetricWeight, calculateChargeableWeight } from "../lib/services/rate-engine";
import { detectZoneFromAddress } from "../lib/services/zone-service";
import { autoAssignOrder, manualAssignOrder } from "../lib/services/assignment-service";
import { updateOrderStatus, isValidStatusTransition, generateTrackingNumber } from "../lib/services/order-service";
import { rescheduleDelivery } from "../lib/services/reschedule-service";
import { signToken, verifyToken } from "../lib/auth";

let testPassed = 0;
let testFailed = 0;

function check(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    testPassed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
    testFailed++;
  }
}

async function runSeniorQAAudit() {
  console.log("=================================================================");
  console.log("🔍 SENIOR QA, SECURITY, UX & REQUIREMENTS AUDIT SUITE");
  console.log("=================================================================\n");

  // -------------------------------------------------------------------------
  // SCENARIO 1: CUSTOMER ORDER CREATION & RATE ENGINE ACCURACY
  // -------------------------------------------------------------------------
  console.log("📌 1. Customer Order Flow & Mathematical Exactness:");

  const customerUser = await prisma.user.findFirst({
    where: { role: "CUSTOMER", email: "ananya.customer@gmail.com" },
  });
  check(!!customerUser, "Customer persona 'Ananya Deshmukh' exists in DB");

  // Addresses: Koramangala 560034 to Whitefield 560066
  const pickupDetection = await detectZoneFromAddress("560034", "Koramangala");
  const dropDetection = await detectZoneFromAddress("560066", "Whitefield");

  check(pickupDetection.zoneCode === "BLR_SOUTH", "Pickup 560034 mapped to BLR_SOUTH");
  check(dropDetection.zoneCode === "BLR_EAST", "Drop 560066 mapped to BLR_EAST");

  // Package: 40 x 30 x 20 cm, Actual weight: 3 kg
  const volWeight = calculateVolumetricWeight(40, 30, 20);
  check(volWeight === 4.8, `Volumetric weight (40x30x20 ÷ 5000) is exactly 4.8 kg (actual: ${volWeight} kg)`);

  const chgWeight = calculateChargeableWeight(3, volWeight);
  check(chgWeight === 4.8, `Chargeable weight MAX(3kg, 4.8kg) is exactly 4.8 kg (actual: ${chgWeight} kg)`);

  // B2C, COD, Inter-zone calculation:
  // Active B2C Card: Inter-zone Base ₹90 (covers 1kg), Extra ₹35/kg, COD Surcharge ₹40
  // Additional Weight = 4.8 - 1.0 = 3.8 kg
  // Weight Charge = 3.8 * 35 = ₹133.00
  // Total = 90 + 133 + 40 = ₹263.00
  const quote = await calculateDeliveryPrice({
    orderType: "B2C",
    paymentType: "COD",
    pickupZoneId: pickupDetection.zoneId,
    dropZoneId: dropDetection.zoneId,
    lengthCm: 40,
    breadthCm: 30,
    heightCm: 20,
    actualWeightKg: 3.0,
  });

  check(quote.zoneType === "INTER", "Zone type correctly resolved to INTER-Zone");
  check(quote.baseCharge === 90.0, "B2C Inter-zone base rate is ₹90");
  check(quote.weightCharge === 133.0, `Extra weight charge (3.8kg @ ₹35) is ₹133 (actual: ₹${quote.weightCharge})`);
  check(quote.codSurcharge === 40.0, "COD surcharge is ₹40 flat");
  check(quote.totalAmount === 263.0, `Total price before confirmation is ₹263 (actual: ₹${quote.totalAmount})`);

  // Create Order in Database
  const trackingNo = generateTrackingNumber();
  const createdOrder = await prisma.order.create({
    data: {
      trackingNumber: trackingNo,
      customerId: customerUser!.id,
      orderType: "B2C",
      paymentType: "COD",
      status: "CREATED",
      pickupAddress: "Koramangala 4th Block",
      pickupPincode: "560034",
      pickupArea: "Koramangala",
      pickupCity: "Bengaluru",
      pickupZoneId: pickupDetection.zoneId,
      dropAddress: "Whitefield Main Road",
      dropPincode: "560066",
      dropArea: "Whitefield",
      dropCity: "Bengaluru",
      dropZoneId: dropDetection.zoneId,
      lengthCm: 40,
      breadthCm: 30,
      heightCm: 20,
      actualWeightKg: 3.0,
      volumetricWeightKg: quote.volumetricWeightKg,
      chargeableWeightKg: quote.chargeableWeightKg,
      zoneType: quote.zoneType,
      baseCharge: quote.baseCharge,
      weightCharge: quote.weightCharge,
      codSurcharge: quote.codSurcharge,
      totalAmount: quote.totalAmount,
      trackingEvents: {
        create: {
          previousStatus: null,
          newStatus: "CREATED",
          actorId: customerUser!.id,
          actorRole: "CUSTOMER",
          notes: `Order created for ₹${quote.totalAmount} (COD, ${quote.chargeableWeightKg}kg)`,
        },
      },
      attempts: {
        create: { attemptNumber: 1, status: "CREATED", notes: "Initial attempt" },
      },
    },
  });

  check(!!createdOrder.id, `Order successfully persisted in DB with ID: ${createdOrder.id} (${trackingNo})`);

  // Auto-Assign Courier
  const assignResult = await autoAssignOrder(createdOrder.id, customerUser!.id, "SYSTEM");
  check(assignResult.success === true, `Agent auto-assigned: ${assignResult.agentName} (Reason: ${assignResult.reason})`);

  // -------------------------------------------------------------------------
  // SCENARIO 2: DELIVERY AGENT LIFECYCLE PROGRESSION
  // -------------------------------------------------------------------------
  console.log("\n📌 2. Delivery Agent Route Progression Flow:");

  const assignedOrder = await prisma.order.findUnique({
    where: { id: createdOrder.id },
  });
  check(!!assignedOrder?.assignedAgentId, "Order is assigned to an agent profile");

  const agentProfile = await prisma.agentProfile.findUnique({
    where: { id: assignedOrder!.assignedAgentId! },
    include: { user: true },
  });

  // Step 1: PICKED_UP
  const step1 = await updateOrderStatus({
    orderId: createdOrder.id,
    newStatus: "PICKED_UP",
    actorId: agentProfile!.userId,
    actorRole: "DELIVERY_AGENT",
    location: "Koramangala Hub",
    notes: `Collected parcel from customer doorstep by ${agentProfile!.user.name}`,
  });
  check(step1?.status === "PICKED_UP", "Order transitioned to PICKED_UP");

  // Step 2: IN_TRANSIT
  const step2 = await updateOrderStatus({
    orderId: createdOrder.id,
    newStatus: "IN_TRANSIT",
    actorId: agentProfile!.userId,
    actorRole: "DELIVERY_AGENT",
    location: "Outer Ring Road Transit Hub",
    notes: "Parcel departed sorting center",
  });
  check(step2?.status === "IN_TRANSIT", "Order transitioned to IN_TRANSIT");

  // Step 3: OUT_FOR_DELIVERY
  const step3 = await updateOrderStatus({
    orderId: createdOrder.id,
    newStatus: "OUT_FOR_DELIVERY",
    actorId: agentProfile!.userId,
    actorRole: "DELIVERY_AGENT",
    location: "Whitefield Delivery Hub",
    notes: `${agentProfile!.user.name} is out for delivery`,
  });
  check(step3?.status === "OUT_FOR_DELIVERY", "Order transitioned to OUT_FOR_DELIVERY");

  // Step 4: DELIVERED
  const step4 = await updateOrderStatus({
    orderId: createdOrder.id,
    newStatus: "DELIVERED",
    actorId: agentProfile!.userId,
    actorRole: "DELIVERY_AGENT",
    location: "Whitefield Destination",
    notes: `Delivered and ₹${createdOrder.totalAmount} COD cash collected by ${agentProfile!.user.name}`,
  });
  check(step4?.status === "DELIVERED", "Order transitioned to DELIVERED (Terminal state)");

  // Verify full immutable timeline
  const fullOrder = await prisma.order.findUnique({
    where: { id: createdOrder.id },
    include: { trackingEvents: { orderBy: { timestamp: "asc" } } },
  });
  check(
    fullOrder?.trackingEvents.length === 6,
    `All 6 milestone events & assignment logged in immutable tracking history (actual: ${fullOrder?.trackingEvents.length})`
  );

  // -------------------------------------------------------------------------
  // SCENARIO 3: FAILED DELIVERY & RESCHEDULING ENGINE
  // -------------------------------------------------------------------------
  console.log("\n📌 3. Failed Delivery & Rescheduling Workflow:");

  // Create another order for failure simulation
  const failOrderNo = generateTrackingNumber();
  const orderForFailure = await prisma.order.create({
    data: {
      trackingNumber: failOrderNo,
      customerId: customerUser!.id,
      orderType: "B2C",
      paymentType: "COD",
      status: "OUT_FOR_DELIVERY",
      pickupAddress: "JP Nagar",
      pickupPincode: "560078",
      pickupZoneId: pickupDetection.zoneId,
      dropAddress: "HSR Layout",
      dropPincode: "560102",
      dropZoneId: pickupDetection.zoneId,
      lengthCm: 20,
      breadthCm: 15,
      heightCm: 10,
      actualWeightKg: 1.0,
      volumetricWeightKg: 0.6,
      chargeableWeightKg: 1.0,
      zoneType: "INTRA",
      baseCharge: 50.0,
      weightCharge: 0.0,
      codSurcharge: 40.0,
      totalAmount: 90.0,
      assignedAgentId: agentProfile!.id,
      assignedAgentName: agentProfile!.user.name,
    },
  });

  // Agent marks FAILED with reason
  const markedFailed = await updateOrderStatus({
    orderId: orderForFailure.id,
    newStatus: "FAILED",
    actorId: agentProfile!.userId,
    actorRole: "DELIVERY_AGENT",
    failureReason: "CUSTOMER_UNAVAILABLE",
    failureNotes: "Doorbell unanswered and phone unreachable after 3 calls",
  });

  check(markedFailed?.status === "FAILED", "Order status transitioned to FAILED");
  check(markedFailed?.failureReason === "CUSTOMER_UNAVAILABLE", "Failure reason correctly recorded");

  // Verify attempt 1 is marked failed
  const attemptsAfterFail = await prisma.deliveryAttempt.findMany({
    where: { orderId: orderForFailure.id },
  });
  check(attemptsAfterFail.some((a) => a.status === "FAILED"), "DeliveryAttempt record preserved as FAILED");

  // Verify customer in-app notification
  const customerNotif = await prisma.notification.findFirst({
    where: { orderId: orderForFailure.id, type: "DELIVERY_FAILED" },
  });
  check(!!customerNotif, `Customer notified of failure: "${customerNotif?.title}"`);

  // Customer Reschedules Delivery
  const rescheduleDate = new Date(Date.now() + 48 * 3600 * 1000);
  const rescheduledOrder = await rescheduleDelivery({
    orderId: orderForFailure.id,
    rescheduledDate: rescheduleDate,
    rescheduleSlot: "Morning (09:00 AM - 01:00 PM)",
    rescheduleReason: "Customer will be home on weekend morning",
    actorId: customerUser!.id,
    actorRole: "CUSTOMER",
  });

  check(rescheduledOrder?.status === "IN_TRANSIT", "Rescheduled order reset to IN_TRANSIT for new attempt");
  check(rescheduledOrder?.attempts.length === 2, `New DeliveryAttempt created (Total attempts: ${rescheduledOrder?.attempts.length})`);
  check(
    rescheduledOrder?.attempts[0].status === "FAILED" && rescheduledOrder?.attempts[1].status === "IN_TRANSIT",
    "Previous failed attempt #1 preserved and attempt #2 initialized in transit"
  );
  check(!!rescheduledOrder?.assignedAgentId, `Courier automatically reassigned for new attempt: ${rescheduledOrder?.assignedAgentName}`);

  // -------------------------------------------------------------------------
  // SCENARIO 4: ADMIN OPERATIONS, ASSIGNMENT & STATUS OVERRIDE
  // -------------------------------------------------------------------------
  console.log("\n📌 4. Admin Management, Manual Dispatch & Status Override:");

  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });
  check(!!adminUser, "Admin persona exists in DB");

  // Manual Agent Assignment
  const anotherAgent = await prisma.agentProfile.findFirst({
    where: { status: "AVAILABLE" },
    include: { user: true },
  });

  if (anotherAgent) {
    const manualAssign = await manualAssignOrder(orderForFailure.id, anotherAgent.id, adminUser!.id, "ADMIN");
    check(manualAssign.success === true, `Admin manually assigned order to ${anotherAgent.user.name}`);
  }

  // Admin Status Override with Mandatory Audit Log
  const adminOverride = await updateOrderStatus({
    orderId: orderForFailure.id,
    newStatus: "OUT_FOR_DELIVERY",
    actorId: adminUser!.id,
    actorRole: "ADMIN",
    notes: "Operations override: Dispatched on priority express route per customer request",
  });

  check(adminOverride?.status === "OUT_FOR_DELIVERY", "Admin status override applied");

  const latestAudit = await prisma.trackingEvent.findFirst({
    where: { orderId: orderForFailure.id },
    orderBy: { timestamp: "desc" },
  });
  check(
    latestAudit?.actorRole === "ADMIN" && (latestAudit?.notes?.includes("Admin Status Override") ?? false),
    `Audit trail records admin override: "${latestAudit?.notes}"`
  );

  // -------------------------------------------------------------------------
  // SCENARIO 5: SECURITY, RBAC & STATE TRANSITION CONSTRAINTS
  // -------------------------------------------------------------------------
  console.log("\n📌 5. Security, RBAC & Invalid Transition Rejections:");

  // Terminal state check: DELIVERED cannot transition to IN_TRANSIT
  const invalidTransition1 = isValidStatusTransition("DELIVERED", "IN_TRANSIT", "DELIVERY_AGENT");
  check(invalidTransition1.valid === false, "Agent transition DELIVERED -> IN_TRANSIT strictly rejected");

  // Step skip check: CREATED cannot jump directly to DELIVERED
  const invalidTransition2 = isValidStatusTransition("CREATED", "DELIVERED", "DELIVERY_AGENT");
  check(invalidTransition2.valid === false, "Agent transition CREATED -> DELIVERED strictly rejected");

  // Backward jump check: PICKED_UP cannot jump backward to CREATED
  const invalidTransition3 = isValidStatusTransition("PICKED_UP", "CREATED", "DELIVERY_AGENT");
  check(invalidTransition3.valid === false, "Backward transition PICKED_UP -> CREATED rejected");

  // JWT Token Signing and Verification
  const token = signToken({
    userId: adminUser!.id,
    email: adminUser!.email,
    role: "ADMIN",
    name: adminUser!.name,
  });
  const verified = verifyToken(token);
  check(Boolean(verified?.role === "ADMIN" && verified?.userId === adminUser!.id), "JWT signing and cryptographic verification intact");

  // -------------------------------------------------------------------------
  // SCENARIO 6: DATABASE PERSISTENCE & ALL RATE COMBINATIONS
  // -------------------------------------------------------------------------
  console.log("\n📌 6. All Rate Combinations & DB Persistence:");

  const allCombinations = [
    { type: "B2C" as const, zone: "INTRA" as const, wt: 1.0, pay: "PREPAID" as const, expected: 50.0 },
    { type: "B2C" as const, zone: "INTRA" as const, wt: 2.0, pay: "COD" as const, expected: 115.0 },
    { type: "B2C" as const, zone: "INTER" as const, wt: 1.0, pay: "PREPAID" as const, expected: 90.0 },
    { type: "B2C" as const, zone: "INTER" as const, wt: 3.0, pay: "COD" as const, expected: 200.0 },
    { type: "B2B" as const, zone: "INTRA" as const, wt: 2.0, pay: "PREPAID" as const, expected: 80.0 },
    { type: "B2B" as const, zone: "INTRA" as const, wt: 5.0, pay: "COD" as const, expected: 184.0 },
    { type: "B2B" as const, zone: "INTER" as const, wt: 2.0, pay: "PREPAID" as const, expected: 140.0 },
    { type: "B2B" as const, zone: "INTER" as const, wt: 4.0, pay: "COD" as const, expected: 240.0 },
  ];

  for (const combo of allCombinations) {
    const pZone = combo.zone === "INTRA" ? pickupDetection.zoneId : pickupDetection.zoneId;
    const dZone = combo.zone === "INTRA" ? pickupDetection.zoneId : dropDetection.zoneId;

    const res = await calculateDeliveryPrice({
      orderType: combo.type,
      paymentType: combo.pay,
      pickupZoneId: pZone,
      dropZoneId: dZone,
      lengthCm: 20,
      breadthCm: 15,
      heightCm: 10,
      actualWeightKg: combo.wt,
    });

    check(
      res.totalAmount === combo.expected,
      `${combo.type} ${combo.zone} ${combo.wt}kg ${combo.pay} equals exactly ₹${combo.expected} (actual: ₹${res.totalAmount})`
    );
  }

  console.log("\n=================================================================");
  console.log(`📊 SENIOR QA SUMMARY: ${testPassed} Passed | ${testFailed} Failed`);
  console.log("=================================================================\n");

  if (testFailed > 0) process.exit(1);
}

runSeniorQAAudit()
  .catch((e) => {
    console.error("Audit error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
