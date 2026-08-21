#!/bin/bash

generate_transaction() {
  local tx_id="tx_$RANDOM$RANDOM"
  local user_id="user_$((1 + RANDOM % 100))"
  local amount=$((1000 + RANDOM % 500000))
  local timestamp=$(date +%s)
  local locations=("IN" "US" "SG" "UK" "BR")
  local loc_index=$((RANDOM % 5))
  local location=${locations[$loc_index]}
  local device_id="dev_$RANDOM"
  local mcc="mcc_$((500 + RANDOM % 500))"

  echo "{\"transaction_id\": \"$tx_id\", \"user_id\": \"$user_id\", \"amount\": $amount, \"timestamp\": $timestamp, \"location\": \"$location\", \"device_id\": \"$device_id\", \"merchant_category\": \"$mcc\"}"
}
while true; do
  generate_transaction
  sleep 0.5
done
