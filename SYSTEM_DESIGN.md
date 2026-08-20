# System Design Write-Up: Last-Mile Delivery Management Platform

## 1. Rate Calculation Engine

The Rate Calculation Engine is designed as a centralized, deterministic backend service (`lib/services/rate-engine.ts`) that guarantees transparent, predictable logistics billing strictly using Indian Metric SI units (dimensions in **centimeters**, physical weights in **kilograms**, and monetary values in **Indian Rupees ₹ INR**).

### Mathematical Core & Rules
1. **Volumetric Weight Formula**:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
   Standard courier cubic conversion factor $5000\text{ cm}^3/\text{kg}$ converts dimensional volume to chargeable weight.
2. **Chargeable Weight Determination**:
   $$\text{Chargeable Weight} = \max(\text{Actual Physical Weight}, \text{Volumetric Weight})$$
3. **Zone Classification**:
   - If $\text{Pickup Zone} = \text{Drop Zone} \rightarrow \textbf{INTRA-ZONE}$
   - If $\text{Pickup Zone} \neq \text{Drop Zone} \rightarrow \textbf{INTER-ZONE}$
4. **Dynamic Database Rate Card Lookup**:
   The engine reads the active `RateCard` record corresponding to the `OrderType` (`B2C` Retail vs `B2B` Commercial). Pricing components:
   - **Base Delivery Rate ($R_{\text{base}}$)**: Covers initial weight up to $W_{\text{base}}$ (e.g. 1.0 kg for B2C, 2.0 kg for B2B).
   - **Additional Weight ($W_{\text{extra}}$)**: $\max(0, \text{Chargeable Weight} - W_{\text{base}})$.
   - **Extra Weight Charge**: $W_{\text{extra}} \times R_{\text{extra-per-kg}}$.
   - **COD Surcharge ($S_{\text{COD}}$)**: Flat ₹40.00 handling fee applied if `PaymentType === 'COD'`, otherwise ₹0.00.
5. **Final Total Amount**:
   $$\text{Total Price (₹)} = R_{\text{base}} + (W_{\text{extra}} \times R_{\text{extra-per-kg}}) + S_{\text{COD}}$$

The engine exposes a pre-calculation API (`/api/rates/calculate`) allowing customers to preview the itemized mathematical breakdown before confirming orders.

---

## 2. Zone Detection Approach

The Zone Detection Engine (`lib/services/zone-service.ts`) decouples geographic addresses from delivery routing using a hierarchical matching pipeline:

```
[Customer Address Input]
         │
         ▼
 1. 6-digit Pincode Exact Match (ZoneArea DB) ────► Match Found ──► Return Zone
         │ (miss)
         ▼
 2. Area Name Fuzzy Match (ZoneArea DB) ─────────► Match Found ──► Return Zone
         │ (miss)
         ▼
 3. Address Text Keyword Substring Match ────────► Match Found ──► Return Zone
         │ (miss)
         ▼
 4. Default Active City Hub Fallback ────────────► Active Zone ──► Return Zone
```

- **Pincode Mapping**: Matches 6-digit Indian postal codes (e.g., `560034` $\rightarrow$ Koramangala $\rightarrow$ `BLR_SOUTH`).
- **Zone Proximity Matrix**: A spatial cost matrix defines adjacency scores ($0.0$ to $3.0$) between city zones (e.g. South to Central = $1.0$, South to North = $3.0$). When GPS coordinates are unavailable, this matrix provides deterministic distance estimations for cross-zone dispatching.

---

## 3. Auto-Assignment Logic & Agent Availability Modelling

Fleet allocation uses a deterministic multi-criteria scoring algorithm (`lib/services/assignment-service.ts`) that balances courier proximity with workload distribution.

### Agent Availability States
- `AVAILABLE`: Courier is online, on shift, and has capacity ($<5$ active packages).
- `BUSY`: Courier has reached maximum concurrent capacity ($5$ deliveries).
- `OFFLINE`: Courier is off duty.

### Deterministic 5-Tier Scoring Pipeline
When an order is created or rescheduled, the auto-assignment engine queries all agents where `status === 'AVAILABLE'` and evaluates a composite score:

$$\text{Composite Score} = (\text{ZoneMatchBonus}) + \text{ProximityScore} + (\text{ActiveDeliveries} \times 1.5)$$

1. **Exact Pickup Zone Match**: Agents currently located in the order's pickup zone receive top priority ($\text{Bonus} = 0$, non-match adds $+2.0$).
2. **Zone Proximity Matrix**: Evaluates proximity score between courier's current zone and pickup hub ($0.0$ to $3.0$).
3. **Workload Balancing**: Couriers with fewer active shipments are preferred ($+1.5$ per active package).
4. **Deterministic Tie-Breakers**: Higher customer rating ($\star$), followed by lexicographical Agent ID.

Every assignment decision (e.g., *"Auto-assigned: Exact pickup zone match (Bengaluru South Zone), workload 1 active pkg, rating 4.9★"*) is committed transactionally and recorded into the immutable tracking history.

---

## 4. Order Lifecycle & Failed Delivery Handling

### State Machine Lifecycle
The platform enforces a strict unidirectional transition graph:
$$\text{CREATED} \longrightarrow \text{PICKED\_UP} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{OUT\_FOR\_DELIVERY} \longrightarrow \text{DELIVERED}$$
$$\text{Any Active State} \longrightarrow \textbf{FAILED}$$

Invalid transitions (e.g., `DELIVERED` $\rightarrow$ `IN_TRANSIT` or `CREATED` $\rightarrow$ `DELIVERED`) are rejected with `400 Bad Request`.

### Failed Delivery & Rescheduling Flow
```
Delivery Agent marks FAILED 
  ├── Captures mandatory reason (CUSTOMER_UNAVAILABLE, INCORRECT_ADDRESS, etc.)
  ├── Creates immutable DeliveryAttempt #1 record
  ├── Decrements agent workload (Agent becomes AVAILABLE)
  └── Triggers in-app + Email/SMS notification to Customer
         │
         ▼
Customer views Tracking Page / Dashboard Alert
  ├── Clicks "Reschedule Delivery"
  ├── Selects new date & preferred slot (Morning / Afternoon / Evening)
  └── Submits Reschedule Request
         │
         ▼
Backend Reschedule Service (`lib/services/reschedule-service.ts`)
  ├── Updates order status back to IN_TRANSIT
  ├── Creates DeliveryAttempt #2 record preserving historical attempt logs
  ├── Appends immutable TrackingEvent audit note
  └── Triggers Auto-Assignment Engine to allocate available courier for the new slot
```
