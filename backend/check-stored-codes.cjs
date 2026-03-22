// Check what verification codes are stored in memory
// This simulates what's in the backend's verificationCodes Map

console.log("🔍 Checking Verification Codes Storage\n");
console.log("=" * 50);

// Format phone number function (same as backend)
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";
  let cleaned = phoneNumber.replace(/\D/g, "");
  if (cleaned.startsWith("964")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  return `+964${cleaned}`;
}

console.log("📋 How verification codes are stored:");
console.log("");
console.log("Key Format: studentId:formattedPhoneNumber");
console.log("Value: { code, expiresAt, studentId }");
console.log("");

console.log("📋 Example storage:");
console.log("Key: 'student123:+9647867972480'");
console.log(
  "Value: { code: '529244', expiresAt: Date, studentId: 'student123' }"
);
console.log("");

console.log("🔧 DEBUGGING YOUR ISSUE:");
console.log("");
console.log("1. ✅ You received code '529244' on WhatsApp");
console.log("2. ❌ But the verify-code endpoint needs 3 parameters:");
console.log("   - schoolCode (e.g., 'DEFAULT01')");
console.log("   - studentCode (e.g., 'STU001')");
console.log("   - verificationCode ('529244')");
console.log("");

console.log("🎯 THE PROBLEM:");
console.log("Your mobile app is probably only sending the verification code");
console.log("but missing the schoolCode and studentCode!");
console.log("");

console.log("🔧 THE SOLUTION:");
console.log("1. Check your mobile app's verify-code API call");
console.log("2. Make sure it sends all 3 required parameters");
console.log("3. Use the SAME schoolCode and studentCode from forgot-password");
console.log("");

console.log("📱 MOBILE APP FIX NEEDED:");
console.log("Instead of sending only:");
console.log("{ verificationCode: '529244' }");
console.log("");
console.log("Send all three:");
console.log("{");
console.log("  schoolCode: 'DEFAULT01',");
console.log("  studentCode: 'STU001',");
console.log("  verificationCode: '529244'");
console.log("}");
console.log("");

console.log("=" * 50);
console.log("🎯 NEXT STEPS:");
console.log("1. Update your mobile app to send all 3 parameters");
console.log("2. Or modify the backend to not require schoolCode/studentCode");
console.log("3. Test with the debug script: node debug-verify-code.cjs");
