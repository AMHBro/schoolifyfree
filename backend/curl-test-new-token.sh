#!/bin/bash

# Test WhatsApp API with your newest token
echo "🚀 Testing WhatsApp API with Your Latest Token"
echo "📱 Sending to: +9647867972480"
echo "🔑 Using your newest token"
echo "=" * 50

# Your newest token
TOKEN="EAAR3I1ynndgBPGNUzKPY24QKKZCsChbIg4xlQMPVnna1zuOIgnYBoixY22ZBSxkdV69JUKHP6e8GwEZCSZAhxbdUWKfdAfeHC7I6EJgjmCn9adPNaYZCutKHqspkU0q5m8vkOcJGLVRxZACUFTUFKtWTm9TBjK2UC4E3nwbAjwmuIFyoep5jW4RIcMgGwgLG85N99ZAd8dI0iD1xrci5yR2d1ZCn66Dx46Xm8xZBWdZCMMbgZDZD"

# Phone number ID
PHONE_ID="704358609434073"

# Your phone number
YOUR_NUMBER="+9647867972480"

echo "📤 Attempting to send text message..."

curl -i -X POST \
  "https://graph.facebook.com/v22.0/${PHONE_ID}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"${YOUR_NUMBER}\",
    \"type\": \"text\",
    \"text\": {
      \"body\": \"🎉 TOKEN TEST SUCCESSFUL!\\n\\nYour latest WhatsApp token is working perfectly!\\n\\n✅ Authentication: Valid\\n✅ Phone Format: Correct (+9647867972480)\\n✅ API Connection: Active\\n✅ Forgot Password System: Ready!\\n\\nTest completed at $(date)\"
    }
  }"

echo ""
echo "=" * 50
echo "✅ Test completed!"
echo ""
echo "🔍 RESULTS ANALYSIS:"
echo "📞 HTTP 200 = Token works perfectly!"
echo "❌ HTTP 400/401 = Token expired or invalid" 
echo "❌ Error 131047 = Need to message business number first"
echo "❌ Error 131058 = Template restriction (hello_world only for test numbers)"
echo ""
echo "💡 NEXT STEPS:"
echo "1. If you get HTTP 200: Check your WhatsApp for the message!"
echo "2. If you get error 131047: Send 'Hi' to +964 776 576 3780 first"
echo "3. If token is expired: Generate a new one"