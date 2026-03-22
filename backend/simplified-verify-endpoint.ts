// Simplified verify-code endpoint that only needs the verification code
// Add this to replace your current verify-code endpoint

.post(
  "/api/mobile/auth/verify-code-simple",
  async ({ body, set }) => {
    const { verificationCode } = body as {
      verificationCode: string;
    };

    // Validate input
    if (!verificationCode) {
      set.status = 400;
      return {
        success: false,
        message: "Verification code is required",
      };
    }

    try {
      // Search through all stored verification codes to find a match
      let matchedEntry = null;
      let matchedKey = null;

      for (const [key, value] of verificationCodes.entries()) {
        if (value.code === verificationCode) {
          // Check if not expired
          if (value.expiresAt > new Date()) {
            matchedEntry = value;
            matchedKey = key;
            break;
          } else {
            // Clean up expired code
            verificationCodes.delete(key);
          }
        }
      }

      if (!matchedEntry) {
        set.status = 400;
        return {
          success: false,
          message: "Invalid or expired verification code",
        };
      }

      // Remove the used code
      verificationCodes.delete(matchedKey);

      return {
        success: true,
        message: "Verification code is valid",
        data: {
          resetToken: `${matchedEntry.studentId}:${verificationCode}:${Date.now()}`,
        },
      };
    } catch (error) {
      console.error("Verify code error:", error);
      set.status = 500;
      return {
        success: false,
        message: "Internal server error",
      };
    }
  },
  {
    body: t.Object({
      verificationCode: t.String({
        description: "6-digit verification code received via WhatsApp",
        example: "123456",
        minLength: 6,
        maxLength: 6,
      }),
    }),
    detail: {
      tags: ["Mobile Auth"],
      summary: "Verify code (simplified)",
      description: "Verify the 6-digit code received via WhatsApp - simplified version that only needs the code",
    },
  }
)