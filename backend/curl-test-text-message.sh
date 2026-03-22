#!/bin/bash

# Test WhatsApp text message using cURL with your production token
# Based on WhatsApp Business API documentation

echo "🚀 Testing WhatsApp TEXT message with cURL (Production API)"
echo "📱 Sending to: +9647867972480"
echo "🔑 Using your production token"
echo "⚠️  IMPORTANT: You must message the business number first to open the 24-hour window!"
echo "=" * 50

# Your production token
TOKEN="EAAR3I1ynndgBPCYN4yGsPf4LRgfhZCnorHZBRsxWj27E166GEXWZAIZCHeJgeg6NtfhSIBuhpzbz76c56pUHQKJdSPiv8c1qq9bZAf8WAx00xzip7A21YyZAsb4i05FUWZBg9rJXKf8tRl9ZBJxbDA8j4LtKwdo5eWX22dpe4m077BM65ePdkJYGWWapSObJIgZDZD"

# Phone number ID
PHONE_ID="704358609434073"

# Your phone number
YOUR_NUMBER="+9647867972480"

echo "📤 Sending text message..."

curl -i -X POST \
  "https://graph.facebook.com/v22.0/${PHONE_ID}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"${YOUR_NUMBER}\",
    \"type\": \"text\",
    \"text\": {
      \"body\": \"🎉 SUCCESS! Your production WhatsApp API token is working!\\n\\nThis confirms:\\n✅ Token is valid\\n✅ Phone formatting is correct\\n✅ Your forgot password system is ready!\\n\\nTest completed successfully! 🚀\"
    }
  }"

echo ""
echo "=" * 50
echo "✅ cURL command executed!"
echo ""
echo "🔍 WHAT TO EXPECT:"
echo "📞 If you receive the message: Your new token works perfectly!"
echo "❌ If you get error 131047: You need to message your business number first"
echo ""
echo "💡 TROUBLESHOOTING:"
echo "1. From your WhatsApp (+9647867972480), send 'Hi' to your business number"
echo "2. Wait 30 seconds"
echo "3. Run this script again"
echo ""
echo "🎯 Your business number should be: +964 776 576 3780"