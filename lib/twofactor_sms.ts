import axios from 'axios'

export async function sendSmsOTP(phoneNumber: string, otp: string) {
  const twoFactorApiKey = process.env.TWO_FACTOR_API_KEY; // Your 2Factor API Key

  try {
    const url = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${twoFactorApiKey}&to=${phoneNumber}&from=GARAGE&templatename=360Electronics&var1=${otp}`;

    const response = await axios.get(url);

    if (response.data.Status === 'Success') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending transactional SMS:', error);
    return false;
  }
}
