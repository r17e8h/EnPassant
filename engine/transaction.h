#include <cstdint>
#include <string>

struct Transaction {
  std::string transaction_id;
  std::string user_id;
  uint64_t amount;
  uint64_t timestamp;
  std::string location;
  std::string device_id;
  std::string merchant_category;
};
