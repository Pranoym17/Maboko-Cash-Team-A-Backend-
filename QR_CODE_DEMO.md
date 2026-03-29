# QR Code Functionality Demo

This document demonstrates the complete QR code workflow integrated into the Maboko Cash Backend. 

---

## Overview

The QR code system allows each user to have a unique QR code that encodes their user ID. This QR code can be:
- Generated automatically when a user registers
- Retrieved and displayed as an image
- Scanned to retrieve the user's profile information

---
psql -h localhost -U maboko_user -d maboko_cash

## Step 1: Create a New User Account

First, register a new user in the system. The backend will automatically generate a QR code for this user.

### Request
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "fullName": "John Doe"
  }'
```

### Response
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a303262a-4dae-46a9-86e4-c857cd9f24cd",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

**Save the user ID for the next steps:** `a303262a-4dae-46a9-86e4-c857cd9f24cd`

---

## Step 2: Retrieve the User's QR Code

Now fetch the QR code for the newly created user. The QR code is returned as a data URL (base64-encoded PNG image).

### Request
```bash
curl -X GET http://localhost:3000/users/a303262a-4dae-46a9-86e4-c857cd9f24cd/qrcode \
  -H "Content-Type: application/json"
```

### Response
```json
{"qrCode":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATKSURBVO3BQY4kRxIEQdNA/f/Lun2jnwJIpFdzhmsi+CNVS06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFn7wE5DepmYBMaiYgk5oJyKRmAjKpeQPIpOYGyG9S88ZJ1aKTqkUnVYs+WaZmE5AbNROQGyBPqHkDyKRmAjKpuVGzCcimk6pFJ1WLTqoWffJlQJ5Q84aaCciNmgnIpGYCcqNmUvNNQJ5Q800nVYtOqhadVC365C8H5EbNBGQCMqmZgNyoqX+cVC06qVp0UrXok/8YNROQSc0EZAJyo+YNIP9lJ1WLTqoWnVQt+uTL1Pyb1GwCcqPmRs0mNX+Sk6pFJ1WLTqoWfbIMyJ8EyKTmRs0EZFIzAbkBMqmZgExqboD8yU6qFp1ULTqpWvTJS2r+ZGomIG8AmdS8oeZGzd/kpGrRSdWik6pFn7wEZFLzBJBJzQTkCSCTmknNDZB/E5BNam6ATGreOKladFK16KRq0SfLgDyh5kbNBGQTkEnNG0BugExqbtT8TU6qFp1ULTqpWvTJL1PzBJBJzRNAJjU3QG7UfJOaCcik5gbIv+mkatFJ1aKTqkWfvKTmDSCTmknNJiCTmgnIpGYCcqPmDSCb1NwA2XRSteikatFJ1aJPlgG5UTOpuQEyqXlDzQTkCTUTkAnIpGYCcqNmAnID5AbIpOabTqoWnVQtOqla9MlLQG7UTEAmNTdqngAyqXkDyKTmRs0EZFJzA+QJNROQGyCTmk0nVYtOqhadVC365CU1m4DcqHkDyKRmE5BJzQRkUjOpmYC8oWYCMgGZ1LxxUrXopGrRSdUi/JFFQCY1N0AmNU8AuVEzAblRMwF5Qs0TQN5QcwPkCTVvnFQtOqladFK16JNlaiYgN2pugNyomYDcqLkB8oSaJ4BMaiYgTwCZ1Nyo+aaTqkUnVYtOqhbhj7wAZFJzA2RSMwGZ1ExA3lCzCcik5gkgN2qeAPKEmk0nVYtOqhadVC3CH/kiIJOaJ4BMam6ATGqeAHKjZgLyhpoJyI2aN4DcqHnjpGrRSdWik6pF+CO/CMiNmhsgT6i5AXKjZgJyo+YJIG+omYBMam6ATGreOKladFK16KRq0ScvAblRc6PmBsik5gkgfxIgm4BMap5Qs+mkatFJ1aKTqkWfvKTmCTVPqLkBMqm5UTMBuQEyqbkBMql5Qs0TQG6ATGomIJOaN06qFp1ULTqpWvTJS0B+k5obIJOaGzXfBOQNIJOaGyCTmt90UrXopGrRSdWiT5ap2QTkRs0TQCY1N0Bu1ExqJiBvqHlCzQRkUvNNJ1WLTqoWnVQt+uTLgDyh5gkgN2qeAHKj5g01E5AJyBtAnlCz6aRq0UnVopOqRZ/85dRMQDapmYC8AeSb1ExAftNJ1aKTqkUnVYs++T8HZFJzo2YC8oaaGyCTmgnIjZoJyI2aN06qFp1ULTqpWvTJl6n5mwB5Q80EZFJzA2RSMwGZ1NwA+U0nVYtOqhadVC36ZBmQ3wTkCTUTkEnNE0CeADKpeQPIpGZSMwGZ1Gw6qVp0UrXopGoR/kjVkpOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVp0UrXopGrR/wDX8zI3jlB+8gAAAABJRU5ErkJggg=="}
```

**Note:** The full QR code is much longer. This is a base64-encoded PNG image.

---

## Step 3: Display QR Code as an Image

You can display the QR code in multiple ways:

### Save as PNG and View

Extract the base64 data and decode it to a PNG file:

```bash
# Save the QR code data from the response, then:
curl -s http://localhost:3000/users/a303262a-4dae-46a9-86e4-c857cd9f24cd/qrcode \
  | jq -r '.qrCode' \
  | sed 's/data:image\/png;base64,//' \
  | base64 -d > user_qrcode.png

# Open the image
open user_qrcode.png
```

This creates a PNG file that looks like a standard QR code square.

### Display in HTML with QR Data

Create an HTML file named `view_qrcode.html` that displays both the QR code image and the data encoded within it:

```html
<!DOCTYPE html>
<html>
<head>
    <title>User QR Code Viewer</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 50px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .user-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }
        .user-info p {
            margin: 8px 0;
            color: #555;
            font-size: 14px;
        }
        .user-info strong {
            color: #333;
            display: block;
            margin-top: 10px;
            font-size: 16px;
        }
        .qr-section {
            margin: 30px 0;
        }
        .qr-section h3 {
            color: #667eea;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        img {
            border: 3px solid #667eea;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            max-width: 350px;
            width: 100%;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
        }
        .qr-data {
            background: #f0f4ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid #d5dff2;
        }
        .qr-data p {
            margin: 0;
            color: #333;
            font-size: 13px;
            color: #666;
            word-break: break-all;
        }
        .data-label {
            font-weight: bold;
            color: #667eea;
            display: block;
            margin-bottom: 8px;
            font-size: 12px;
            text-transform: uppercase;
        }
        .data-value {
            font-family: 'Courier New', monospace;
            background: white;
            padding: 10px;
            border-radius: 4px;
            margin: 8px 0;
            word-break: break-all;
            font-size: 12px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>👤 User QR Code</h1>
        
        <div class="user-info">
            <p><strong>John Doe</strong></p>
            <p>john.doe@example.com</p>
        </div>

        <div class="qr-section">
            <h3>📱 QR Code</h3>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATKSURBVO3BQY4kRxIEQdNA/f/Lun2jnwJIpFdzhmsi+CNVS06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFn7wE5DepmYBMaiYgk5oJyKRmAjKpeQPIpOYGyG9S88ZJ1aKTqkUnVYs+WaZmE5AbNROQGyBPqHkDyKRmAjKpuVGzCcimk6pFJ1WLTqoWffJlQJ5Q84aaCciNmgnIpGYCcqNmUvNNQJ5Q800nVYtOqhadVC36ZC8H5EbNBGQCMqmZgNyoqX+cVC06qVp0UrXok/8YNROQSc0EZAJyo+YNIP9lJ1WLTqoWnVQt+uTL1Pyb1GwCcqPmRs0mNX+Sk6pFJ1WLTqoWfbIMyJ8EyKTmRs0EZFIzAbkBMqmZgExqboD8yU6qFp1ULTqpWvTJS2r+ZGomIG8AmdS8oeZGzd/kpGrRSdWik6pFn7wEZFLzBJBJzQTkCSCTmknNDZB/E5BNam6ATGreOKladFK16KRq0SfLgDyh5kbNBGQTkEnNG0BugExqbtT8TU6qFp1ULTqpWvTJL1PzBJBJzRNAJjU3QG7UfJOaCcik5gbIv+mkatFJ1aKTqkWfvKTmDSCTmknNJiCTmgnIpGYCcqPmDSCb1NwA2XRSteikatFJ1aJPlgG5UTOpuQEyqXlDzQTkCTUTkAnIpGYCcqNmAnID5AbIpOabTqoWnVQtOqla9MlLQG7UTEAmNTdqngAyqXkDyKTmRs0EZFJzA+QJNROQGyCTmk0nVYtOqhadVC36ZCU1m4DcqHkDyKRmE5BJzQRkUjOpmYC8oWYCMgGZ1LxxUrXopGrRSdUi/JFFQCY1N0AmNU8AuVEzAblRMwF5Qs0TQN5QcwPkCTVvnFQtOqladFK16JNlaiYgN2pugNyomYDcqLkB8oSaJ4BMaiYgTwCZ1Nyo+aaTqkUnVYtOqhbhj7wAZFJzA2RSMwGZ1ExA3lCzCcik5gkgN2qeAPKEmk0nVYtOqhadVC36ZBmQGzU3QJ4AsknNDZAbNZOaGyCTmhs1E5An1Gw6qVp0UrXopGrRJy8BmdRMQCY1E5BJzaRmAjKpuQHyhJon1DwBZFJzA2RSc6PmCSCTmjdOqhadVC06qVr0yUtqJiA3QG6A3Ki5AfKEmhsgN2omIDdqnlDzBpDfdFK16KRq0UnVIvyRPwjIpGYTkCfUTECeUDMBuVFzA2RS8wSQJ9S8cVK16KRq0UnVIvyRLwIyqXkCyBNqJiA3aiYgk5pNQJ5QMwG5UfMEkEnNGydVi06qFp1ULfpkGZAbIJOaCcikZgLyhpoJyKRmAvKEmhs1E5BJzRtAJjUTkG86qVp0UrXopGrRJy8BmdTcAHkCyBtqJiBvqHkDyBtqJiCTmifUbDqpWnRSteikatEnL6mZgNyomYDcqHkCyI2aCcgTQCY1N0AmNTdAJjU3aiYgk5rfdFK16KRq0UnVok9eAjKpeUPNBORGzSYgTwCZ1DwBZFLzBJC/yUnVopOqRSdVi/BHvgjIE2reADKpeQLIjZobIJOaTUAmNTdAJjXfdFK16KRq0UnVok9eAjKpeUPNBORGzSYgTwCZ1DwBZFLzBJC/yUnVopOqRSdVi/BHvgjIE2reADKpeQLIjZobIJOaTUAmNTdAJjXfdFK16KRq0UnVok9SAAAAAA=="
             alt="User QR Code">
        </div>

        <div class="qr-data">
            <span class="data-label">📋 Data Encoded in QR Code</span>
            <div class="data-value">a303262a-4dae-46a9-86e4-c857cd9f24cd</div>
            <p style="margin-top: 10px; font-size: 12px;">This is the unique User ID that gets decoded when the QR code is scanned. The backend uses this ID to retrieve the user's complete profile.</p>
        </div>

        <div class="footer">
            <p>✨ Unique QR Code for User Identification & Lookup</p>
        </div>
    </div>
</body>
</html>
```

Save this file as `view_qrcode.html` and open it in your browser to see the QR code with the encoded data displayed underneath.


## Step 4: Simulate QR Code Scan

When a QR code is scanned, it decodes to the user's ID. The backend provides an endpoint to retrieve the user's complete profile by "scanning" (sending) the QR code data.

### Request
```bash
curl -X POST http://localhost:3000/users/qrcode/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qrCodeData": "a303262a-4dae-46a9-86e4-c857cd9f24cd"
  }'
```

### Response
```json
{
  "id": "a303262a-4dae-46a9-86e4-c857cd9f24cd",
  "email": "john.doe@example.com",
  "fullName": "John Doe",
  "role": "user",
  "isActive": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATxSURBVO3BQY4cSRIEQdNA/f/Lun30UwCJ9GqSsyaCP1K15KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVr0yUtAfpOaCcik5gbIpGYCMqmZgExqJiCTmgnIpOYGyG9S88ZJ1aKTqkUnVYs+WaZmE5A3gNwAeULNBOQJNROQSc2Nmk1ANp1ULTqpWnRSteiTLwPyhJon1ExAJjU3QCY1b6i5ATKpeQPIE2q+6aRq0UnVopOqRZ/844BMaiYgk5pJzQ2QSc0NkBs1E5BJzb/spGrRSdWik6pFn/zj1DwBZFLzBJBJzRNA/stOqhadVC06qVr0yZep+ZPUTEBugExqboBMaiYg36Tmb3JSteikatFJ1aJPlgH5TUAmNROQSc0EZFIzAZnUvKFmAvIEkL/ZSdWik6pFJ1WLPnlJzb8EyBNqngDyhJobNf+Sk6pFJ1WLTqoW4Y+8AGRSMwG5UTMBeULNJiCTmieATGomIDdqJiCTmhsgk5oJyI2aN06qFp1ULTqpWvTJS2omIJOaCcgEZFLzBJBJzQRkUjMBuQEyqblR84SaN4A8oWYCsumkatFJ1aKTqkWffBmQGzU3QJ4AsknNDZAbNZOaGyCTmhs1E5An1Gw6qVp0UrXopGrRJy8BmdRMQCY1E5BJzaRmAjKpuQHyhJon1DwBZFJzA2RSc6PmCSCTmjdOqhadVC06qVr0yUtqJiA3QG6A3Ki5AfKEmhsgN2omIDdqnlDzBpDfdFK16KRq0UnVIvyRPwjIpGYTkCfUTECeUDMBuVFzA2RS8wSQJ9S8cVK16KRq0UnVIvyRLwIyqXkCyBNqJiA3aiYgk5pNQJ5QMwG5UfMEkEnNGydVi06qFp1ULfpkGZAbIJOaCcikZgLyhpoJyKRmAvKEmhs1E5BJzRtAJjUTkG86qVp0UrXopGrRJy8BmdTcAHkCyBtqJiBvqHkDyBtqJiCTmifUbDqpWnRSteikatEnL6mZgNyomYDcqHkCyI2aCcgTQCY1N0AmNTdAJjU3aiYgk5rfdFK16KRq0UnVok9eAjKpeUPNBORGzSYgTwCZ1DwBZFLzBJC/yUnVopOqRSdVi/BHvgjIE2reADKpeQLIjZobIJOaTUAmNTdAJjXfdFK16KRq0UnVok9eAjKpeUPNBORGzSYgTwCZ1DwBZFLzBJC/yUnVopOqRSdVi/BHvgjIE2reADKpeQLIjZobIJOaTUAmNTdAJjXfdFK16KRq0UnVok9SAAAAAA=="
}
```

This response includes:
- **id**: User's unique identifier
- **email**: User's email address
- **fullName**: User's full name
- **role**: User's role in the system
- **isActive**: Whether the user account is active
- **qrCode**: The QR code as a data URL (for re-displaying if needed)

---

## Complete Workflow Summary

```
┌─────────────────────────────────────────────────────┐
│ 1. USER REGISTRATION                                │
│   POST /auth/register                               │
│   └─> User created with auto-generated QR code      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. RETRIEVE QR CODE                                 │
│   GET /users/{userId}/qrcode                        │
│   └─> Returns QR code as data URL (PNG base64)      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. DISPLAY QR CODE                                  │
│   • Save PNG file                                   │
│   • Display in HTML <img> tag                       │
│   • Display in web interface                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. SCAN QR CODE                                     │
│   POST /users/qrcode/scan                           │
│   Body: { "qrCodeData": "{userId}" }               │
│   └─> Returns complete user profile                 │
└─────────────────────────────────────────────────────┘
```

---

## Testing All Steps Together

Here's a bash script to run the entire workflow:

```bash
#!/bin/bash

echo "=== STEP 1: Create User Account ==="
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo.user@example.com",
    "password": "DemoPass123!",
    "fullName": "Demo User"
  }')

echo $USER_RESPONSE | jq .

# Extract user ID
USER_ID=$(echo $USER_RESPONSE | jq -r '.user.id')
echo "✓ User created with ID: $USER_ID"

echo -e "\n=== STEP 2: Retrieve QR Code ==="
QR_RESPONSE=$(curl -s -X GET http://localhost:3000/users/$USER_ID/qrcode)
echo "✓ QR code retrieved"
echo "QR Code data length: $(echo $QR_RESPONSE | jq -r '.qrCode' | wc -c) characters"

echo -e "\n=== STEP 3: Save QR Code as PNG ==="
echo $QR_RESPONSE | jq -r '.qrCode' | sed 's/data:image\/png;base64,//' | base64 -d > demo_qrcode.png
echo "✓ QR code saved to: demo_qrcode.png"

echo -e "\n=== STEP 4: Simulate QR Code Scan ==="
SCAN_RESPONSE=$(curl -s -X POST http://localhost:3000/users/qrcode/scan \
  -H "Content-Type: application/json" \
  -d "{
    \"qrCodeData\": \"$USER_ID\"
  }")

echo "✓ QR code scanned! Retrieved user data:"
echo $SCAN_RESPONSE | jq '{id: .id, email: .email, fullName: .fullName, role: .role, isActive: .isActive}'

echo -e "\n=== ✨ QR Code Workflow Complete ==="
```

Save this as `demo_qrcode.sh` and run:
```bash
chmod +x demo_qrcode.sh
./demo_qrcode.sh
```

---

## Expected Workflow Output

```
=== STEP 1: Create User Account ===
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "demo.user@example.com",
    "fullName": "Demo User",
    "role": "user"
  }
}
✓ User created with ID: 550e8400-e29b-41d4-a716-446655440000

=== STEP 2: Retrieve QR Code ===
✓ QR code retrieved
QR Code data length: 827 characters

=== STEP 3: Save QR Code as PNG ===
✓ QR code saved to: demo_qrcode.png

=== STEP 4: Simulate QR Code Scan ===
✓ QR code scanned! Retrieved user data:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "demo.user@example.com",
  "fullName": "Demo User",
  "role": "user",
  "isActive": true
}

=== ✨ QR Code Workflow Complete ===
```

---

## Bonus Feature: Money Request via QR Code

In addition to user identification QR codes, the system now supports **payment request QR codes**. This allows users to request money from others using QR codes that contain:
- Requesting user ID, email, and name
- Amount requested
- Currency
- Request ID for tracking

---

## Step 5: Create a Money Request

A user can create a payment request that will generate a special QR code containing payment information.

### Request
```bash
curl -X POST http://localhost:3000/payments/request \
  -H "Content-Type: application/json" \
  -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YjkxZDgxZi03MmQ3LTQxMmEtYTNkYS02MzFkMzRhMzIyZmYiLCJlbWFpbCI6InJlcXVlc3RlckB0ZXN0LmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc0NDg3NjYyLCJleHAiOjE3NzQ1NzQwNjJ9.pEm6VXBrJpCPqQo788pbqlVy6qrEDZ_V-pqgISEhgJ4" \
  -d '{
    "recipientUserId": "recipient-user-id-here",
    "amount": 500.00,
    "currency": "CDF",
    "message": "Please send payment for services"
  }'
```

### Response
```json
{
  "id": "f1a3b9c2-5d4e-11eb-ae93-0242ac120002",
  "requestingUserId": "550e8400-e29b-41d4-a716-446655440000",
  "requestingUser": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "fullName": "John Doe"
  },
  "recipientUserId": "f1a3b9c2-5d4e-11eb-ae93-0242ac120003",
  "amount": 500.00,
  "currency": "CDF",
  "status": "pending",
  "message": "Please send payment for services",
  "createdAt": "2026-03-25T09:10:00Z",
  "updatedAt": "2026-03-25T09:10:00Z"
}
```

**Save the payment request ID:** `f1a3b9c2-5d4e-11eb-ae93-0242ac120002`

---

## Step 6: Get Payment Request QR Code

Retrieve the QR code for the payment request. The QR code contains all payment details as JSON data.

### Request
```bash
curl -X GET http://localhost:3000/payments/request/f1a3b9c2-5d4e-11eb-ae93-0242ac120002/qrcode
```

### Response
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAASsSURBVO3BQY7kQBLEQQNA/f/Lujv0QytQZGbfheFn/1HV0pOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFn7wE5DepmYBMaiYgk5oJyKRmAjKpeQPIpOYGyG9S88ZJ1aKTqkUnVYs+WaZmE5A3gNwAeULNBOQJNROQSc2Nmk1ANp1ULTqpWnRSteiTLwPyhJon1ExAJjU3QCY1b6i5ATKpeQPIE2q+6aRq0UnVopOqRZ/844BMaiYgk5pJzQ2QSc0NkBs1E5BJzb/spGrRSdWik6pFn/zj1DwBZFLzBJBJzRNA/stOqhadVC06qVr0yZep+ZPUTEBugExqboBMaiYg36Tmb3JSteikatFJ1aJPlgH5TUAmNROQSc0EZFIzAZnUvKFmAvIEkL/ZSdWik6pFJ1WLPnlJzb8EyBNqngDyhJobNf+Sk6pFJ1WLTqoW4Y+8AGRSMwG5UTMBeULNJiCTmieATGomIDdqJiCTmhsgk5oJyI2aN06qFp1ULTqpWvTJS2omIJOaCcgEZFLzBJBJzQRkUjMBuQEyqblR84SaN4A8oWYCsumkatFJ1aKTqkWffBmQGzU3QJ4AsknNDZAbNZOaGyCTmhs1E5An1Gw6qVp0UrXopGrRJy8BmdRMQCY1E5BJzaRmAjKpuQHyhJon1DwBZFJzA2RSc6PmCSCTmjdOqhadVC06qVr0yUtqJiA3QG6A3Ki5AfKEmhsgN2omIDdqnlDzBpDfdFK16KRq0UnVIvyRPwjIpGYTkCfUTECeUDMBuVFzA2RS8wSQJ9S8cVK16KRq0UnVIvyRLwIyqXkCyBNqJiA3aiYgk5pNQJ5QMwG5UfMEkEnNGydVi06qFp1ULfpkGZAbIJOaCcikZgLyhpoJyKRmAvKEmhs1E5BJzRtAJjUTkG86qVp0UrXopGrRJy8BmdTcAHkCyBtqJiBvqHkDyBtqJiCTmifUbDqpWnRSteikatEnL6mZgNyomYDcqHkCyI2aCcgTQCY1N0AmNTdAJjU3aiYgk5rfdFK16KRq0UnVok9eAjKpeUPNBORGzSYgTwCZ1DwBZFLzBJC/yUnVopOqRSdVi/BHvgjIE2reADKpeQLIjZobIJOaTUAmNTdAJjXfdFK16KRq0UnVok9SAAAAAA=="
}
```

This QR code contains JSON with:
```json
{
  "requestId": "f1a3b9c2-5d4e-11eb-ae93-0242ac120002",
  "requestingUserId": "550e8400-e29b-41d4-a716-446655440000",
  "requestingUserEmail": "john.doe@example.com",
  "requestingUserFullName": "John Doe",
  "amount": 500.00,
  "currency": "CDF",
  "message": "Please send payment for services",
  "timestamp": "2026-03-25T09:10:00Z"
}
```

---

## Step 7: Share Payment Request QR Code

Display or share the payment request QR code. Here's an HTML viewer:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Payment Request QR Code</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 50px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .request-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
            text-align: left;
        }
        .info-row {
            margin: 12px 0;
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-label {
            font-weight: bold;
            color: #667eea;
            flex: 1;
        }
        .info-value {
            color: #333;
            flex: 1;
            text-align: right;
        }
        .amount-display {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin: 20px 0;
        }
        .qr-section {
            margin: 30px 0;
        }
        img {
            border: 3px solid #667eea;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            max-width: 350px;
            width: 100%;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
        }
        .qr-data {
            background: #f0f4ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid #d5dff2;
            font-size: 12px;
            color: #666;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💰 Payment Request</h1>
        
        <div class="request-info">
            <div class="info-row">
                <span class="info-label">From:</span>
                <span class="info-value">John Doe</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">john.doe@example.com</span>
            </div>
            <div class="info-row">
                <span class="info-label">Message:</span>
                <span class="info-value">Please send payment for services</span>
            </div>
        </div>

        <div class="amount-display">
            💵 500.00 CDF
        </div>

        <div class="qr-section">
            <h3>📱 Scan to Process Payment</h3>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAA..." alt="Payment Request QR Code">
        </div>

        <div class="qr-data">
            <p><strong>Request ID:</strong> f1a3b9c2-5d4e-11eb-ae93-0242ac120002</p>
            <p><strong>Status:</strong> Pending</p>
        </div>

        <div class="footer">
            <p>✨ Scan this code to view and approve the payment request</p>
        </div>
    </div>
</body>
</html>
```

---

## Step 8: Scan Payment Request QR Code

When someone scans the QR code, they get the payment request details:

### Request
```bash
curl -X POST http://localhost:3000/payments/request/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qrCodeData": "{\"requestId\":\"f1a3b9c2-5d4e-11eb-ae93-0242ac120002\",\"requestingUserId\":\"550e8400-e29b-41d4-a716-446655440000\",\"requestingUserEmail\":\"john.doe@example.com\",\"requestingUserFullName\":\"John Doe\",\"amount\":500.00,\"currency\":\"CDF\",\"message\":\"Please send payment for services\",\"timestamp\":\"2026-03-25T09:10:00Z\"}"
  }'
```

### Response
```json
{
  "id": "f1a3b9c2-5d4e-11eb-ae93-0242ac120002",
  "requestingUserId": "550e8400-e29b-41d4-a716-446655440000",
  "requestingUser": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "fullName": "John Doe"
  },
  "recipientUserId": "f1a3b9c2-5d4e-11eb-ae93-0242ac120003",
  "amount": 500.00,
  "currency": "CDF",
  "status": "pending",
  "message": "Please send payment for services",
  "createdAt": "2026-03-25T09:10:00Z",
  "updatedAt": "2026-03-25T09:10:00Z"
}
```

---

## Step 9: Accept or Reject Payment Request

The recipient can accept or reject the payment request:

### Accept Request
```bash
curl -X POST http://localhost:3000/payments/request/f1a3b9c2-5d4e-11eb-ae93-0242ac120002/accept \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Reject Request
```bash
curl -X POST http://localhost:3000/payments/request/f1a3b9c2-5d4e-11eb-ae93-0242ac120002/reject \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Payment Request API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/request` | Create a new payment request |
| GET | `/payments/request/:id` | Get payment request details |
| GET | `/payments/request/:id/qrcode` | Get payment request QR code |
| POST | `/payments/request/scan` | Scan and decode payment request QR |
| GET | `/payments/requests/incoming` | Get all incoming payment requests |
| POST | `/payments/request/:id/accept` | Accept a payment request |
| POST | `/payments/request/:id/reject` | Reject a payment request |

---

## Payment Request Data Structure

Each payment request QR code contains:
- **requestId** - Unique identifier for this payment request
- **requestingUserId** - UUID of the user requesting payment
- **requestingUserEmail** - Email of the requesting user
- **requestingUserFullName** - Full name of the requesting user
- **amount** - Amount requested (decimal)
- **currency** - Currency code (e.g., CDF)
- **message** - Optional message from requester
- **timestamp** - ISO 8601 timestamp of when request was created

---

## Feature Highlights

### User Identification QR Codes
✅ **Automatic QR Generation** - Every user gets a QR code upon registration  
✅ **Image Display** - QR codes are base64-encoded PNGs for easy display  
✅ **User Lookup** - Scan functionality retrieves complete user profiles  
✅ **Data Security** - Only active users can be retrieved via scanning  
✅ **Efficient Storage** - QR codes stored as data URLs, no external file storage needed  

### Payment Request QR Codes
✅ **Money Request Generation** - Create payment requests with automatic QR encoding  
✅ **Rich Payment Data** - QR codes contain user info, amount, currency, and message  
✅ **Request Tracking** - Unique request IDs for managing payment workflows  
✅ **Status Management** - Track requests as pending, accepted, rejected, or completed  
✅ **Mobile-Friendly** - Share payment requests via QR codes in payments apps
✅ **Secure Scanning** - Decode QR data to retrieve full payment request details  

---

## Integration Points

The QR code functionality can be integrated with:

- **Mobile Apps**: Display QR codes in user profiles
- **Payment Systems**: Include QR codes in payment requests  
- **Identity Verification**: Use QR scans for account verification
- **Contact Exchange**: Share user details via QR code
- **Access Control**: Use QR codes for door locks, checkpoints, etc.
- **Payment Workflows**: Request money from users with QR codes
- **Invoicing**: Share payment requests using QR codes
- **Direct Payments**: Quick money transfer via scanned QR codes

---

**Created:** March 11, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
