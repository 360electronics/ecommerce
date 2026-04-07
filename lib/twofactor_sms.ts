import axios from "axios";

export async function sendSmsOTP(phoneNumber: string, otp: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    throw new Error("Missing MSG91_AUTH_KEY or MSG91_TEMPLATE_ID in environment variables");
  }

  // Ensure phone number has country code (default to India +91)
  const mobile = phoneNumber.startsWith("+")
    ? phoneNumber.replace("+", "")
    : phoneNumber.startsWith("91") && phoneNumber.length === 12
    ? phoneNumber
    : `91${phoneNumber}`;

  try {
    const { data } = await axios.post(
      "https://control.msg91.com/api/v5/flow/",
      {
        template_id: templateId,
        short_url: "0",
        recipients: [
          {
            mobiles: mobile,
            var1: otp,
          },
        ],
      },
      {
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    if (data.type === "success") {
      return true;
    } else {
      console.error("MSG91 OTP send failed:", data);
      return false;
    }
  } catch (error: any) {
    console.error("Error sending OTP via MSG91:", error.message || error);
    return false;
  }
}
