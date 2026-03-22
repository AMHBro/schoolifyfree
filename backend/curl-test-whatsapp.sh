#!/bin/bash

# Test WhatsApp message using cURL with your updated token
# Based on the Twilio WhatsApp cURL tutorial: https://www.twilio.com/en-us/blog/how-to-send-a-message-on-whatsapp-with-curl

echo "🚀 Testing WhatsApp message with cURL"
echo "📱 Sending to: +9647867972480"
echo "🔑 Using your updated token"
echo "=" * 50

# Your updated token
TOKEN="EAAR3I1ynndgBPCYN4yGsPf4LRgfhZCnorHZBRsxWj27E166GEXWZAIZCHeJgeg6NtfhSIBuhpzbz76c56pUHQKJdSPiv8c1qq9bZAf8WAx00xzip7A21YyZAsb4i05FUWZBg9rJXKf8tRl9ZBJxbDA8j4LtKwdo5eWX22dpe4m077BM65ePdkJYGWWapSObJIgZDZD"

# Phone number ID
PHONE_ID="704358609434073"

# Your phone number
YOUR_NUMBER="+9647867972480"

echo "📤 Sending message..."

curl -i -X POST \
  "https://graph.facebook.com/v22.0/${PHONE_ID}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"${YOUR_NUMBER}\",
    \"type\": \"template\",
    \"template\": {
      \"name\": \"hello_world\",
      \"language\": {
        \"code\": \"en_US\"
      }
    }
  }"

echo ""
echo "=" * 50
echo "✅ cURL command executed!"
echo "🔍 Check your WhatsApp for the hello_world template message"
echo "📞 If you receive it, your new token is working perfectly!"