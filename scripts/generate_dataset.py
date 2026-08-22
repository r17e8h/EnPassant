import json
import time
import random

NUM_TRANSACTIONS = 100000
TRAIN_SPLIT = 0.8


def generate_data():
    transactions = []
    users = [f"user_{i}" for i in range(1000)]
    user_devices = {user: f"dev_{i}" for i, user in enumerate(users)}
    current_time = int(time.time()) - (30 * 24 * 60 * 60)
    for i in range(NUM_TRANSACTIONS):
        user = random.choice(users)
        device = user_devices[user]
        is_fraud = 0
        amount = random.randint(100, 50000)
        hour_of_day = (current_time % 86400) // 3600
        if random.random() < 0.015:
            amount = random.randint(300000, 900000)
            is_fraud = 1
            if random.random() < 0.5:
                hour_of_day = random.choice([2, 3, 4])
        if random.random() < 0.01:
            device = "dev_FRAUD_RING_99"
            is_fraud = 1
        tx = {
            "transaction_id": f"tx_{i}",
            "user_id": user,
            "amount": amount,
            "timestamp": current_time,
            "hour_of_day": hour_of_day,
            "location": "IN",
            "device_id": device,
            "is_fraud": is_fraud,
        }
        transactions.append(tx)
        current_time += random.randint(1, 15)
    split_idx = int(NUM_TRANSACTIONS * TRAIN_SPLIT)
    with open("train.jsonl", "w") as f1:
        for tx in transactions[:split_idx]:
            f1.write(json.dumps(tx) + "\n")
    with open("test.jsonl", "w") as f2:
        for tx in transactions[split_idx:]:
            f2.write(json.dumps(tx) + "\n")

    print(f"Generated 100k rows. 80/20 train/test split saved.")


if __name__ == "__main__":
    generate_data()
