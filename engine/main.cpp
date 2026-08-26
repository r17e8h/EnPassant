#include "weights.h"
#include <algorithm>
#include <cmath>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <string>

using namespace emscripten;

inline float relu(float x) { return x > 0 ? x : 0; }

inline float sigmoid(float x) { return 1.0f / (1.0f + std::exp(-x)); }

float run_inference(float amount, float hour, float device_risk) {
  float input[3] = {amount, hour, device_risk};
  float hidden[8] = {0};

  for (int i = 0; i < 8; i++) {
    hidden[i] = B1[i];
    for (int j = 0; j < 3; j++) {
      hidden[i] += W1[i][j] * input[j];
    }
    hidden[i] = relu(hidden[i]);
  }

  float output = B2[0];
  for (int i = 0; i < 8; i++) {
    output += W2[0][i] * hidden[i];
  }

  return sigmoid(output); // returns probability (0.0 to 1.0)
}
val evaluate_transaction(val tx) {
  float amount = tx["amount"].as<float>();
  float hour = tx["hour_of_day"].as<float>();
  std::string device_id = tx["device_id"].as<std::string>();

  float norm_amount = std::min(amount / 1000000.0f, 1.0f);
  float device_risk = (device_id == "auth_FRAUD_NODE") ? 1.0f : 0.0f;

  float fraud_probability = run_inference(norm_amount, hour, device_risk);

  bool is_blocked = fraud_probability > 0.80f;

  val result = val::object();
  result.set("risk_score", fraud_probability * 100.0f);
  result.set("is_blocked", is_blocked);

  return result;
}

EMSCRIPTEN_BINDINGS(enpassant_module) {
  function("evaluateTransaction", &evaluate_transaction);
}
