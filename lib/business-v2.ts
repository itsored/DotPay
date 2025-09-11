import apiClient from './api';

// Types for Business V2
export interface BusinessV2OtpRequest {
  phoneNumber: string; // E.164
}

export interface BusinessV2CreateRequest {
  userId: string; // stable personal user id
  businessName: string;
  ownerName: string;
  phoneNumber: string; // E.164
  location: string;
  businessType: string;
}

export interface BusinessV2CompleteRequest {
  userId: string;
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  location: string;
  businessType: string;
  otp: string; // 6 digits
}

export interface ApiEnvelope<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error?: { code?: string; message?: string } | null;
  timestamp?: string;
}

export interface BusinessV2Profile {
  id: string;
  businessName: string;
  merchantId: string;
  walletAddress: string;
  creditLimit?: number;
  availableCredit?: number;
  currentCredit?: number;
  isVerified?: boolean;
}

// Business account interface matching the API response
export interface BusinessAccount {
  _id?: string; // MongoDB ObjectId
  businessId: string;
  merchantId: string;
  businessName: string;
  businessType: string;
  phoneNumber: string;
  email?: string; // Optional as it might not be in all responses
  walletAddress: string;
  creditLimit: number;
  availableCredit?: number; // Available credit for loans and overdrafts
  currentBalance?: number; // Optional as it might not be in all responses
  overdraftEnabled: boolean;
  status?: 'active' | 'pending' | 'suspended'; // Optional, default to 'active'
  isVerified: boolean;
  pinSet: boolean;
  pinSetAt?: string | null; // Optional
  createdAt?: string; // Optional
  updatedAt?: string; // Optional
}

export interface UserBusinessesResponse {
  businesses: BusinessAccount[];
  totalCount: number;
}

export const businessV2API = {
  // POST /api/business/request-upgrade (Send OTP for business creation)
  requestUpgrade: async (payload: BusinessV2CreateRequest): Promise<ApiEnvelope<{ existingBusinesses?: number }>> => {
    const res = await apiClient.post('/business/request-upgrade', payload);
    return res.data;
  },

  // POST /api/business/complete-upgrade (Verify OTP and create business)
  completeUpgrade: async (payload: BusinessV2CompleteRequest): Promise<ApiEnvelope<{ businessId: string; merchantId: string; walletAddress: string; businessName: string; creditLimit: number; availableCredit: number; overdraftEnabled: boolean }>> => {
    const res = await apiClient.post('/business/complete-upgrade', payload);
    return res.data;
  },

  // GET /api/business/v2/:businessId
  get: async (businessId: string): Promise<ApiEnvelope<{ business: BusinessV2Profile }>> => {
    const res = await apiClient.get(`/business/v2/${businessId}`);
    return res.data;
  },

  // GET /api/business/v2/resolve/merchant/:merchantId
  resolveMerchant: async (merchantId: string): Promise<ApiEnvelope<{ merchantId: string; walletAddress: string; businessName: string }>> => {
    const res = await apiClient.get(`/business/v2/resolve/merchant/${merchantId}`);
    return res.data;
  },

  // GET /api/business/my-businesses - List all user's business accounts
  getUserBusinesses: async (): Promise<ApiEnvelope<UserBusinessesResponse>> => {
    const res = await apiClient.get('/business/my-businesses');
    return res.data;
  },

  // Forgot Password (Owner account via business)
  // POST /api/business/v2/password-reset/request
  passwordResetRequest: async (payload: { merchantId?: string; phoneNumber?: string }): Promise<ApiEnvelope<{ phoneNumber: string; otpExpiry: string }>> => {
    const res = await apiClient.post('/business/v2/password-reset/request', payload);
    return res.data;
  },

  // POST /api/business/v2/password-reset/confirm
  passwordResetConfirm: async (payload: { merchantId?: string; phoneNumber?: string; otp: string; newPassword: string }): Promise<ApiEnvelope<{ userId: string; phoneNumber: string }>> => {
    const res = await apiClient.post('/business/v2/password-reset/confirm', payload);
    return res.data;
  },
};


