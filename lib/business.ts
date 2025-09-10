import apiClient from './api';

// Types
export interface BusinessUpgradeData {
  businessName: string;
  ownerName: string;
  location: string;
  businessType: string;
  phoneNumber: string;
}

export interface CompleteUpgradeData {
  businessId: string;
  otp: string;
}

export interface TransferFundsData {
  businessId: string;
  amount: string;
  walletAddress: string;
}

export interface BusinessResponse {
  success: boolean;
  message: string;
  data: any;
}

// New Business Auth types (OTP-based elevated auth)
export type BusinessAuthContext = 'business_creation' | 'business_action';

export interface BusinessAuthRequestOtpData {
  phoneNumber: string; // E.164
  context: BusinessAuthContext;
}

export interface BusinessAuthVerifyOtpData {
  phoneNumber: string;
  otp: string; // 6 digits
  context: BusinessAuthContext;
}

export interface BusinessAuthSessionResponse extends BusinessResponse {
  data: {
    session?: {
      verified: boolean;
      verifiedAt?: string;
      expiresAt?: string;
      expiresIn?: string | number;
      remainingSeconds?: number;
      context?: BusinessAuthContext;
    };
  } | null;
}

// Business API functions
export const businessAPI = {
  // Request business upgrade
  requestUpgrade: async (data: BusinessUpgradeData): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/request-upgrade', data);
    return response.data;
  },

  // Complete business upgrade
  completeUpgrade: async (data: CompleteUpgradeData): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/complete-upgrade', data);
    return response.data;
  },

  // Transfer funds to personal wallet
  transferFunds: async (data: TransferFundsData): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/transfer-funds', data);
    return response.data;
  },
};

// Business Authentication API (OTP-based elevated session)
export const businessAuthAPI = {
  requestOtp: async (data: BusinessAuthRequestOtpData): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/auth/request-otp', data);
    return response.data;
  },

  verifyOtp: async (data: BusinessAuthVerifyOtpData): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/auth/verify-otp', data);
    return response.data;
  },

  getSession: async (): Promise<BusinessAuthSessionResponse> => {
    const response = await apiClient.get('/business/auth/session');
    return response.data;
  },

  logout: async (): Promise<BusinessResponse> => {
    const response = await apiClient.post('/business/auth/logout', {});
    return response.data;
  },
};