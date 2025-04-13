// auth-utils.ts

// Store auth token in localStorage and cookies
export const storeAuthToken = (token: string) => {
    // Store in localStorage
    localStorage.setItem('auth_token', token);
    
    // Store in cookie (without using next/headers)
    document.cookie = `auth_token=${token}; path=/; max-age=${12 * 60 * 60}; ${
      window.location.protocol === 'https:' ? 'secure;' : ''
    } samesite=strict`;
  };
  
  // Get auth token from localStorage
  export const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };
  
  // Get auth token from cookie
  export const getAuthTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token') {
        return value;
      }
    }
    return null;
  };
  
  // Clear auth token from localStorage and cookies
  export const clearAuthToken = () => {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; max-age=0';
  };
  
  // Check if user is authenticated
  export const isAuthenticated = (): boolean => {
    return !!getAuthToken() || !!getAuthTokenFromCookie();
  };
  
  // Example function to use in profile page to verify phone
  export const requestPhoneVerification = async (userId: string, phoneNumber: string) => {
    try {
      const response = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, phoneNumber }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error requesting phone verification:', error);
      throw error;
    }
  };
  
  // Example function to verify OTP
  export const verifyOTP = async (userId: string, otp: string, type: 'email' | 'phone') => {
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp, type }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        storeAuthToken(data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  };