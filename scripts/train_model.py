import json
import numpy as np
from sklearn.tree import DecisionTreeClassifier


def load_data(filepath):
    X, y = [], []
    with open(filepath, "r") as f:
        for line in f:
            tx = json.loads(line)
            X.append([tx["amount"], tx["hour_of_day"]])
            y.append(tx["is_fraud"])
    return np.array(X), np.array(y)


def export_tree_to_json(tree_model, feature_names):
    tree_ = tree_model.tree_

    def recurse(node):
        if tree_.children_left[node] == -1:  # Leaf node
            class_counts = tree_.value[node][0]
            prob_fraud = class_counts[1] / sum(class_counts)
            return {"type": "leaf", "fraud_probability": round(float(prob_fraud), 4)}
        return {
            "type": "split",
            "feature_index": int(tree_.feature[node]),
            "threshold": float(tree_.threshold[node]),
            "left": recurse(tree_.children_left[node]),
            "right": recurse(tree_.children_right[node]),
        }

    return recurse(0)


print("Loading training data...")
X_train, y_train = load_data("train.jsonl")

print("Training Decision Tree ML Model...")
clf = DecisionTreeClassifier(max_depth=4, random_state=42)
clf.fit(X_train, y_train)

print("Extracting AI Brain to JSON...")
tree_json = export_tree_to_json(clf, ["amount", "hour_of_day"])

with open("tree_model.json", "w") as f:
    json.dump(tree_json, f, indent=2)

print("Success! 'tree_model.json' is ready for C++ ingestion.")
