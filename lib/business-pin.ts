import apiClient from './api';

// Types for Business PIN API
export interface BusinessPinSetData {
  merchantId: string;
  phoneNumber: string;
  otp: string;
  pin: string;
}

export interface BusinessPinSetPublicData {
  merchantId?: string;
  phoneNumber?: string;
  otp: string;
  pin: string;
}

export interface BusinessPinRequestOtpData {
  merchantId: string;
  phoneNumber: string;
}

export interface BusinessPinUpdateData {
  businessId: string;
  oldPin: string;
  newPin: string;
}

export interface BusinessPinVerifyData {
  businessId: string;
  pin: string;
}

export interface BusinessPinVerifyTransactionData {
  businessId: string;
  pin: string;
  transactionType: string;
  amount?: number;
}

export interface BusinessPinForgotRequestData {
  merchantId?: string;
  phoneNumber?: string;
}

export interface BusinessPinForgotConfirmData {
  merchantId?: string;
  phoneNumber?: string;
  otp: string;
  newPin: string;
}

export interface BusinessPinVerifyResponse {
  verified: boolean;
  verifiedAt: string;
  expiresAt: string;
  businessId: string;
  businessName: string;
  merchantId: string;
}

export interface BusinessPinTransactionGuard {
  id: string;
  expiresIn: string;
}

export interface BusinessPinForgotRequestResponse {
  phoneNumber: string;
  otpExpiry: string;
}

export interface BusinessResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error: any;
  timestamp: string;
}

// Business PIN API functions
export const businessPinAPI = {
  // Public endpoints (no auth required)
  
  // Request OTP for PIN setup
  requestOtp: async (data: BusinessPinRequestOtpData): Promise<BusinessResponse<BusinessPinForgotRequestResponse>> => {
    console.log('[business-pin] Requesting OTP with data:', data);
    const response = await apiClient.post('/business/pin/request-otp', data);
    console.log('[business-pin] OTP request response:', response.data);
    return response.data;
  },

  // Set PIN with OTP (public)
  setPinPublic: async (data: BusinessPinSetPublicData): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/pin/set-public', data);
    return response.data;
  },

  // Forgot PIN - Request OTP
  forgotPinRequest: async (data: BusinessPinForgotRequestData): Promise<BusinessResponse<BusinessPinForgotRequestResponse>> => {
    const response = await apiClient.post('/business/pin/forgot', data);
    return response.data;
  },

  // Forgot PIN - Confirm with OTP
  forgotPinConfirm: async (data: BusinessPinForgotConfirmData): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/pin/confirm-forgot', data);
    return response.data;
  },

  // Authenticated endpoints (require Bearer token)
  
  // Set PIN with OTP verification
  setPin: async (data: BusinessPinSetData): Promise<BusinessResponse> => {
    console.log('[business-pin] Making setPin request with data:', data);
    console.log('[business-pin] Request URL: /business/pin/set');
    
    try {
      const response = await apiClient.post('/business/pin/set', data);
      console.log('[business-pin] setPin response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[business-pin] setPin error:', error);
      console.error('[business-pin] setPin error response:', error?.response?.data);
      console.error('[business-pin] setPin request config:', error?.config);
      throw error;
    }
  },

  // Update PIN (requires old PIN)
  updatePin: async (data: BusinessPinUpdateData): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/pin/update', data);
    return response.data;
  },

  // Verify PIN for session
  verifyPin: async (data: BusinessPinVerifyData): Promise<BusinessResponse<BusinessPinVerifyResponse>> => {
    const response = await apiClient.post('/business/pin/verify', data);
    return response.data;
  },

  // Verify PIN for specific transaction
  verifyTransactionPin: async (data: BusinessPinVerifyTransactionData): Promise<BusinessResponse<{ transactionGuard: BusinessPinTransactionGuard }>> => {
    const response = await apiClient.post('/business/pin/verify-transaction', data);
    return response.data;
  },
};
