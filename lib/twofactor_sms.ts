import axios from 'axios';

export async function sendSmsOTP(phoneNumber: string, otp: string) {
  const twoFactorApiKey = process.env.TWO_FACTOR_API_KEY;

  try {
    // This is specific to 2Factor's API format
    const response = await axios.get(`https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${phoneNumber}/${otp}/REDELE`);
    
    if (response.data.Status === 'Success') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}