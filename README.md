# EnPassant: WASM-Powered Client-Side Fraud Detection

## 1. System Architecture

EnPassant is a zero-latency client-side fraud detection engine. By executing a compiled C++ neural network directly in the browser via WebAssembly (WASM), it eliminates backend inference latency and API overhead.

### Tech Stack

* **Model Generation:** PyTorch (Python)
* **Inference Engine:** C++ (compiled via Emscripten)
* **Frontend UI:** Next.js (Static Export), Tailwind CSS, Lucide React

---


## 2. Data Schemas

### Input: Transaction Payload (JSON)

The C++ engine expects the following telemetry structure from the JavaScript client:

```json
{
  "transaction_id": "pay_932317",
  "user_id": "u_733",
  "merchant": "Amazon India",
  "user_name": "User_798",
  "device_name": "MacBook Pro",
  "amount": 10471,
  "timestamp": 1787727400,
  "hour_of_day": 14,
  "location": "IN",
  "device_id": "auth_3921",
  "is_fraud": 0
}

```

### Output: Inference Evaluation (JSON)

The C++ module returns the following object. `risk_score` represents the final **AI Fraud Probability** percentage displayed in the UI.

```json
{
  "risk_score": 12.45,
  "is_blocked": false
}

```

---

## 3. Telemetry Mapping & Heuristics

The C++ engine (`main.cpp`) requires categorical string data to be converted into float tensors prior to matrix multiplication.

* **Amount:** Normalized against a ceiling value (e.g., `amount / 1000000.0f`).
* **Hour of Day:** Evaluated directly (`0.0` to `24.0`).
* **Device Risk:** Extracted from `device_id`.
* `auth_SECURE_NODE` -> `0.0f` (0% base risk).
* `auth_FRAUD_NODE`, Emulators, Rooted -> `1.0f` (100% base risk).
* Unknown states -> `0.5f`.



*Note: The PyTorch model includes bias weighting to allow high-value, late-night transfers (emergency vectors) to clear inference if the originating hardware is flagged as mathematically secure (`0.0f`).*

---

## 4. Build & Compilation Pipeline

### Prerequisites

* Python 3.10+ (with PyTorch)
* Node.js 20+
* Emscripten (`emcc`)

### Step 1: Model Training

Generate the updated neural network weights. Ensure the script outputs directly to `engine/weights.h`.

```bash
python scripts/train_model.py

```

### Step 2: WebAssembly Compilation

Compile the C++ engine to WASM. Execute this from the repository root to route the output directly to the Next.js public directory.

```bash
emcc engine/main.cpp -o web/public/enpassant.js -O3 --bind -s MODULARIZE=1 -s EXPORT_NAME="createEnpassantModule" -s ENVIRONMENT=web

```

### Step 3: Local Frontend Development

```bash
cd web
npm install
npm run dev

```

---

## 5. CLI Injection Commands

The dashboard includes a terminal interface to manually test inference edge cases without modifying source code.

**Syntax:**
`inject --amount [INT] --hour [FLOAT] --device [STRING] --merchant [STRING]`

**Test Cases:**

* **Standard Safe Transaction:**
`inject --amount 5000 --hour 14 --device "auth_SECURE_NODE"`
* **Hostile Fraud Vector:**
`inject --amount 950000 --hour 3 --device "auth_FRAUD_NODE"`
* **Late-Night Emergency Override (Nuance Check):**
`inject --amount 850000 --hour 3 --device "auth_SECURE_NODE"`
