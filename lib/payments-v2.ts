import apiClient from './api';
import { ApiEnvelope } from './business-v2';

export interface ChargeMerchantRequest {
  merchantId: string;
  amount: string; // decimal string
  asset: string; // e.g., USDC
  chain: string; // e.g., arbitrum
}

export interface ChargeWalletRequest {
  walletAddress: string;
  amount: string;
  asset: string;
  chain: string;
}

export const paymentsV2API = {
  // POST /api/payments/v2/charge/merchant
  chargeMerchant: async (payload: ChargeMerchantRequest): Promise<ApiEnvelope<{ transactionHash: string; explorerUrl: string; amount: string; asset: string }>> => {
    const res = await apiClient.post('/payments/v2/charge/merchant', payload);
    return res.data;
  },

  // POST /api/payments/v2/charge/wallet
  chargeWallet: async (payload: ChargeWalletRequest): Promise<ApiEnvelope<{ transactionHash: string; explorerUrl: string; amount: string; asset: string }>> => {
    const res = await apiClient.post('/payments/v2/charge/wallet', payload);
    return res.data;
  },
};



