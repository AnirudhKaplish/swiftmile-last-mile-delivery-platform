# SwiftMile Logistics — Last-Mile Delivery Management Platform

> A production-grade Last-Mile Logistics SaaS platform tailored for Indian delivery networks (Metric SI units: cm, kg, and ₹ INR). Built with Next.js 15 App Router, TypeScript, Tailwind CSS, Prisma ORM, and Role-Based Access Control (RBAC).

---

## 🌟 Key Features

### 1. Customer Experience
- **Consumer-Grade UI**: Fast, responsive, mobile-first design with minimal friction.
- **6-Step Booking Wizard**: Address entry, automatic zone detection from 6-digit Indian postal pincodes, dimensional weight calculator, B2B/B2C toggle, prepaid/COD selection, and instant confirmation.
- **Transparent Price Breakdown**: Real-time pre-calculation before checkout displaying volumetric weight, chargeable weight, base rate, extra weight rate, and COD surcharge.
- **Interactive Tracking Timeline**: Visual milestone timeline (`CREATED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`), courier contact details, and route progress.
- **1-Click Delivery Rescheduling**: When a delivery fails, customers can reschedule to a preferred date and time slot.
- **Public Tracking**: Unauthenticated tracking at `/track/[trackingNumber]` accessible to anyone.

### 2. Delivery Agent Portal
- **Route Dashboard**: "Good morning, [Name]", today's workload summary, and active delivery route queue.
- **COD Collection Badges**: Clear visual indicators for cash-on-delivery collection amounts in ₹.
- **Strict Lifecycle Control**: Controlled step-by-step state transitions with prevention of invalid status jumps.
- **Failure Reason Modal**: Mandatory failure reason selection (`CUSTOMER_UNAVAILABLE`, `INCORRECT_ADDRESS`, etc.) with doorstep notes.

### 3. Admin Command Center
- **Operations Intelligence**: Real-time metrics (Total Orders, Active In-Transit, Delivered Today, Failed Deliveries, Total Revenue in ₹, Available Fleet, Success Rate %).
- **Order Management Console**: Search & multi-filtering (Status, Zone, Courier, Order Type, Payment Mode), Pricing Breakdown inspection, Manual Courier Assignment, 1-Click Auto-Assignment trigger, and Status Override with audit logging.
- **Zone & Area Management**: CRUD operations for delivery zones and mapping 6-digit Indian pincodes & areas.
- **Rate Cards Management**: Live rate card editor for B2B and B2C Intra/Inter-zone base rates, extra kg rates, and COD surcharges with a built-in Rate Simulation Sandbox.
- **Fleet Management**: Monitor agent availability (`AVAILABLE`, `BUSY`, `OFFLINE`), active delivery counts, ratings, and vehicle details.

---

## 📐 Mathematical Formulas (Indian SI Units)

- **Volumetric Weight**:
  $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
- **Chargeable Weight**:
  $$\text{Chargeable Weight} = \max(\text{Actual Weight (kg)}, \text{Volumetric Weight (kg)})$$
- **Additional Weight**:
  $$\text{Additional Weight} = \max(0, \text{Chargeable Weight} - \text{Base Weight})$$
- **Total Billed Delivery Charge**:
  $$\text{Total Price (₹)} = \text{Base Rate} + (\text{Additional Weight} \times \text{Extra Rate Per Kg}) + \text{COD Surcharge}$$

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js `v18+` or `v20+` or `v22+`
- npm

### 1. Install Dependencies
```bash
cd lastmile-delivery-platform
npm install
```

### 2. Setup Environment Variables
Create a `.env` file (copied from `.env.example`):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="swiftmile-secure-jwt-key-2026"
NEXT_PUBLIC_APP_NAME="SwiftMile Logistics"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **PostgreSQL Compatibility**: To connect to Neon, Supabase, or Railway in production, simply replace `DATABASE_URL` with your PostgreSQL connection string:
> `DATABASE_URL="postgresql://user:password@host/database?sslmode=require"`

### 3. Initialize Database & Seed Realistic Indian Logistics Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Automated Business Logic Test Suite
```bash
npx tsx src/__tests__/business-logic.test.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 👤 Seeded Demo Personas (Instant Switcher in Demo Banner)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **🛡️ Admin** | `admin@swiftmile.in` | `adminpassword123` | Rajesh Sharma (Operations Head) |
| **🛵 Delivery Agent** | `vikram.agent@swiftmile.in` | `password123` | Vikram Singh (Hero Splendor KA-01-EA-1011) |
| **👤 Customer (Retail)** | `ananya.customer@gmail.com` | `password123` | Ananya Deshmukh (Bengaluru) |
| **🏢 Customer (B2B)** | `logistics@zenithelec.in` | `password123` | Zenith Electronics Pvt Ltd |

> **DEMO MODE Banner**: A quick persona switcher is available at the top of every screen to instantly switch between Admin, Agent, and Customer without logging out manually.

---

## 🌐 API Reference

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Login with email & password, sets JWT cookie |
| `/api/auth/register` | `POST` | Public | Register new customer or delivery agent |
| `/api/auth/demo-login` | `POST` | Public | Instant 1-click evaluator persona switcher |
| `/api/auth/me` | `GET` | Authenticated | Fetch current user session profile |
| `/api/rates/calculate` | `POST` | Public/Auth | Live volumetric rate calculation with breakdown |
| `/api/zones` | `GET`, `POST` | Public/Admin | List zones or create new delivery zone |
| `/api/zones/detect` | `POST` | Public/Auth | Auto-detect zone from pincode, area, or address |
| `/api/rate-cards` | `GET`, `POST` | Public/Admin | Fetch active rate cards or create new card |
| `/api/rate-cards/[id]` | `PUT` | Admin | Update intra/inter zone base & extra rates |
| `/api/orders` | `GET`, `POST` | Authenticated | List filtered orders or book new delivery order |
| `/api/orders/[id]` | `GET` | Authenticated | Fetch complete order with audit history |
| `/api/orders/[id]/status` | `POST` | Agent/Admin | Transition status or mark delivery failure with reason |
| `/api/orders/[id]/assign` | `POST` | Admin | Manually assign specific agent to order |
| `/api/orders/[id]/auto-assign` | `POST` | Customer/Admin | Trigger intelligent deterministic auto-assignment |
| `/api/orders/[id]/reschedule` | `POST` | Customer/Admin | Reschedule failed delivery for new date & slot |
| `/api/orders/track/[trackingNumber]` | `GET` | Public | Public unauthenticated shipment tracking |
| `/api/agents` | `GET` | Authenticated | List fleet couriers and workload statistics |
| `/api/analytics/dashboard` | `GET` | Admin | Fetch operational metrics, revenue, and charts |

---

## 🧪 Verification & Acceptance Testing

The platform has been verified against all requirements:
1. **Rate Engine**: Verified volumetric calculation $(50 \times 40 \times 30\text{ cm} \rightarrow 12.0\text{ kg})$, chargeable weight selection, B2B/B2C Intra/Inter rate lookups, and ₹40 COD surcharge.
2. **Deterministic Auto-Assignment**: Evaluated agent availability, zone match bonus, proximity scoring, workload balancing, and tie-breakers.
3. **Strict Lifecycle**: Validated state machine transitions and confirmed invalid transitions (e.g. `DELIVERED` $\rightarrow$ `IN_TRANSIT`) are strictly blocked.
4. **Failed Delivery & Rescheduling**: Verified failure reason capture, customer notification, attempt incrementation, historical log preservation, and automatic courier re-assignment.
5. **End-to-End Build**: Clean `next build` with zero TypeScript or linting errors.

---

## 📄 License
MIT License. Built for Last-Mile Logistics Innovation.
