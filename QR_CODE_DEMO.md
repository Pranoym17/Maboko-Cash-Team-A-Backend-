# QR Code Functionality Demo

This document demonstrates the complete QR code workflow integrated into the Maboko Cash Backend. 

---

## Overview

The QR code system allows each user to have a unique QR code that encodes their user ID. This QR code can be:
- Generated automatically when a user registers
- Retrieved and displayed as an image
- Scanned to retrieve the user's profile information

---

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

## Feature Highlights

✅ **Automatic QR Generation** - Every user gets a QR code upon registration  
✅ **Image Display** - QR codes are base64-encoded PNGs for easy display  
✅ **User Lookup** - Scan functionality retrieves complete user profiles  
✅ **Data Security** - Only active users can be retrieved via scanning  
✅ **Efficient Storage** - QR codes stored as data URLs, no external file storage needed  

---

## Integration Points

The QR code functionality can be integrated with:

- **Mobile Apps**: Display QR codes in user profiles
- **Payment Systems**: Include QR codes in payment requests
- **Identity Verification**: Use QR scans for account verification
- **Contact Exchange**: Share user details via QR code
- **Access Control**: Use QR codes for door locks, checkpoints, etc.

---

**Created:** March 11, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
