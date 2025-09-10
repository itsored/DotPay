import apiClient from './api';
import { ApiEnvelope } from './business-v2';

export interface EarnDepositRequest {
  businessId: string;
  amount: string;
  asset: string; // e.g., USDC
}

export interface EarnWithdrawRequest {
  businessId: string;
  amount: string;
  asset: string;
}

export const earnV2API = {
  // POST /api/earn/v2/deposit
  deposit: async (payload: EarnDepositRequest): Promise<ApiEnvelope<{ sharesMinted: string; poolBalance: string }>> => {
    const res = await apiClient.post('/earn/v2/deposit', payload);
    return res.data;
  },

  // POST /api/earn/v2/withdraw
  withdraw: async (payload: EarnWithdrawRequest): Promise<ApiEnvelope<{ amountReceived: string; poolBalance: string }>> => {
    const res = await apiClient.post('/earn/v2/withdraw', payload);
    return res.data;
  },
};



