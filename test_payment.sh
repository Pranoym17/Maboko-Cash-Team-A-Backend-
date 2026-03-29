#!/bin/bash

# Generate unique timestamps for email addresses
TIMESTAMP=$(date +%s%N)

echo "=== Creating Requester User ==="
USER1=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"requester-${TIMESTAMP}@test.com\",
    \"password\": \"Password123!\",
    \"fullName\": \"John Requester\"
  }" | jq -r '.user.id')
echo "Requester ID: $USER1"

echo -e "\n=== Creating Recipient User ==="
USER2=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"recipient-${TIMESTAMP}@test.com\",
    \"password\": \"Password123!\",
    \"fullName\": \"Jane Recipient\"
  }" | jq -r '.user.id')
echo "Recipient ID: $USER2"

echo -e "\n=== Getting JWT Token ==="
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"requester-${TIMESTAMP}@test.com\",
    \"password\": \"Password123!\"
  }" | jq -r '.access_token')
echo "Token: $TOKEN"

echo -e "\n=== Creating Payment Request ==="
PAYMENT=$(curl -s -X POST http://localhost:3000/payments/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"recipientUserId\": \"$USER2\",
    \"amount\": 500.00,
    \"currency\": \"CDF\",
    \"message\": \"Payment for services\"
  }")

echo $PAYMENT | jq .
PAYMENT_ID=$(echo $PAYMENT | jq -r '.id')
echo -e "\nPayment Request ID: $PAYMENT_ID"

echo -e "\n=== Getting QR Code ==="
AMOUNT=$(echo $PAYMENT | jq -r '.amount')
CURRENCY=$(echo $PAYMENT | jq -r '.currency')
REQUESTER_NAME=$(echo $PAYMENT | jq -r '.requestingUser.fullName' | tr ' ' '_')
RECIPIENT_NAME=$(echo $PAYMENT | jq -r '.recipientUser.fullName' | tr ' ' '_')

# Create descriptive filename
QR_FILENAME="payment_qr_from_${REQUESTER_NAME}_to_${RECIPIENT_NAME}_${AMOUNT}_${CURRENCY}.png"

# Download the styled PNG QR code from the new endpoint
curl -s http://localhost:3000/payments/request/$PAYMENT_ID/qrcode-image -o "$QR_FILENAME"
echo "✓ Styled QR Code saved to: $QR_FILENAME"

# Display the QR code image
echo "✓ Opening QR code image..."
open "$QR_FILENAME"

echo -e "\n✨ Test Complete!"