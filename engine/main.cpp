#include "nlohmann/json.hpp"
#include <algorithm>
#include <fstream>
#include <iostream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

using json = nlohmann::json;

struct Transaction {
  std::string transaction_id;
  std::string user_id;
  uint64_t amount;
  uint64_t timestamp;
  int hour_of_day;
  std::string location;
  std::string device_id;
  int is_fraud;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Transaction, transaction_id, user_id, amount,
                                   timestamp, hour_of_day, location, device_id,
                                   is_fraud)

class RiskEngine {
private:
  std::unordered_map<std::string, std::vector<uint64_t>> user_velocity;
  std::unordered_map<std::string, std::unordered_set<std::string>> device_users;
  std::unordered_map<std::string, std::pair<std::string, uint64_t>>
      user_location;
  json ai_model;

  const size_t MAX_TX_COUNT = 4;
  const uint64_t VELOCITY_WINDOW = 60;
  const uint64_t IMPOSSIBLE_TRAVEL_WINDOW = 3600;

  float runInference(const json &node, const Transaction &tx) {
    if (node["type"] == "leaf") {
      return node["fraud_probability"];
    }

    float feature_value = (node["feature_index"] == 0)
                              ? static_cast<float>(tx.amount)
                              : static_cast<float>(tx.hour_of_day);

    if (feature_value <= node["threshold"]) {
      return runInference(node["left"], tx);
    } else {
      return runInference(node["right"], tx);
    }
  }

public:
  void loadAIModel(const std::string &filepath) {
    std::ifstream f(filepath);
    if (!f.is_open()) {
      std::cerr << "Failed to load AI model. Are you in the root directory?\n";
      exit(1);
    }
    ai_model = json::parse(f);
    std::cout << "Native AI Model Loaded Successfully.\n";
  }

  int evaluateRisk(const Transaction &tx) {
    int risk_score = 100;

    float ai_probability = runInference(ai_model, tx);
    if (ai_probability > 0.5) {
      risk_score -= static_cast<int>(ai_probability * 70);
    }

    auto &velocity = user_velocity[tx.user_id];
    velocity.push_back(tx.timestamp);
    while (!velocity.empty() &&
           (tx.timestamp - velocity.front() > VELOCITY_WINDOW)) {
      velocity.erase(velocity.begin());
    }
    if (velocity.size() > MAX_TX_COUNT) {
      risk_score -= 50;
    }

    device_users[tx.device_id].insert(tx.user_id);
    if (device_users[tx.device_id].size() > 2) {
      risk_score -= 60;
    }
    if (user_location.find(tx.user_id) != user_location.end()) {
      auto last_loc = user_location[tx.user_id];
      if (last_loc.first != tx.location &&
          (tx.timestamp - last_loc.second < IMPOSSIBLE_TRAVEL_WINDOW)) {
        risk_score -= 50;
      }
    }
    user_location[tx.user_id] = {tx.location, tx.timestamp};

    return std::max(0, risk_score);
  }
};

int main() {
  RiskEngine engine;
  engine.loadAIModel("tree_model.json");

  std::string line;
  int true_positives = 0, false_positives = 0, true_negatives = 0,
      false_negatives = 0;
  uint64_t total_false_positive_cost = 0;
  const float AVG_PROFIT_MARGIN = 0.02f;

  std::cout << "Running EnPassant Defense Evaluation on Test Set...\n";

  while (std::getline(std::cin, line)) {
    if (line.empty())
      continue;
    try {
      json j = json::parse(line);
      Transaction tx = j.get<Transaction>();

      int score = engine.evaluateRisk(tx);
      bool engine_blocked = (score < 70);

      if (engine_blocked && tx.is_fraud == 1)
        true_positives++;
      else if (!engine_blocked && tx.is_fraud == 0)
        true_negatives++;
      else if (engine_blocked && tx.is_fraud == 0) {
        false_positives++;
        total_false_positive_cost += (tx.amount * AVG_PROFIT_MARGIN);
      } else if (!engine_blocked && tx.is_fraud == 1)
        false_negatives++;

    } catch (std::exception &e) {
      std::cerr << "Parse error: " << e.what() << '\n';
    }
  }

  float precision =
      (true_positives + false_positives == 0)
          ? 0
          : (float)true_positives / (true_positives + false_positives);
  float recall =
      (true_positives + false_negatives == 0)
          ? 0
          : (float)true_positives / (true_positives + false_negatives);

  std::cout << "\n=== ENPASSANT SYSTEM METRICS ===\n";
  std::cout << "Precision: " << (precision * 100) << "%\n";
  std::cout << "Recall: " << (recall * 100) << "%\n";
  std::cout << "False Positives (Legit Blocked): " << false_positives << "\n";
  std::cout << "Financial Cost of False Positives: ₹"
            << total_false_positive_cost << "\n";

  return 0;
}
