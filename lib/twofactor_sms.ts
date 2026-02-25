import axios from "axios";

export async function sendSmsOTP(phoneNumber: string, otp: string) {
  const twoFactorApiKey = process.env.TWO_FACTOR_API_KEY; // Your 2Factor API Key

  if (!twoFactorApiKey) {
    throw new Error("Missing TWO_FACTOR_API_KEY in environment variables");
  }

  try {
    const url = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${twoFactorApiKey}&to=${phoneNumber}&from=GARAGE&templatename=360Electronics&var1=${otp}`;

    const { data } = await axios.get(url);

    if (data.Status === "Success") {
      // console.log("✅ OTP SMS sent successfully to", phoneNumber);
      return true;
    } else {
      console.error("❌ Failed to send OTP:", data);
      return false;
    }
  } catch (error: any) {
    console.error("🚨 Error sending transactional SMS:", error.message || error);
    return false;
  }
}
