import apiClient from './api';
import { ApiResponse } from './wallet';
import { CryptoToMpesaResponse } from '../types/api-types';

// Types
export interface DepositData {
  amount: string;
  phoneNumber: string;
  token: string;
  chain: string;
}

export interface BuyCryptoData {
  amount: number; // Amount in KES/USD (not crypto amount)
  phoneNumber?: string; // Made optional for compatibility with different API signatures
  phone?: string; // Made optional for compatibility with different API signatures
  chain: string;
  tokenType?: string; // Made optional for compatibility
  tokenSymbol?: string; // Alternative field name used by some endpoints
  currency?: 'KES' | 'USD'; // Optional currency field for backend processing
}

export interface WithdrawData {
  amount: string;
  phoneNumber: string;
  token?: string; // Made optional for compatibility
  tokenSymbol?: string; // Alternative field name
  chain: string;
}

export interface PayBillData {
  businessNumber: string;
  accountNumber: string;
  amount: string;
  token: string;
  chain: string;
}

export interface PayTillData {
  tillNumber: string;
  amount: string;
  token: string;
  chain: string;
}

export interface PayWithCryptoData {
  amount: number; // fiat amount (KES)
  cryptoAmount: number; // token amount to spend (REQUIRED)
  targetType: 'paybill' | 'till';
  targetNumber: string; // paybill or till number
  accountNumber?: string; // required for paybill
  chain: string;
  tokenType: string; // e.g., USDC
  description?: string;
  password?: string; // security: password or google
  googleAuthCode?: string; // alternative to password
}

export interface CryptoToMpesaData {
  amount: number; // crypto amount to withdraw
  phone: string; // recipient phone e.g., 2547XXXXXXXX
  tokenType?: string; // optional, defaults to "USDC"
  chain?: string; // optional, defaults to "celo"
  password: string; // required authentication (no longer optional)
}

export interface TransactionStatus {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  amount: string;
  phoneNumber: string;
  mpesaReceiptNumber?: string;
  txHash?: string;
  timestamp: string;
}

export interface SubmitReceiptData {
  transactionId: string;
  receiptNumber: string;
  amount: string;
  phoneNumber: string;
}

export interface PendingIntervention {
  id: string;
  type: 'deposit' | 'withdraw' | 'payment';
  amount: string;
  phoneNumber: string;
  status: 'failed' | 'pending_manual';
  error: string;
  timestamp: string;
}

// M-Pesa Integration API
export const mpesaAPI = {
  // Fiat to Crypto (On-Ramp)
  deposit: async (data: DepositData): Promise<ApiResponse> => {
    const response = await apiClient.post('/mpesa/deposit', data);
    return response.data;
  },

  buyCrypto: async (data: BuyCryptoData): Promise<ApiResponse> => {
    const response = await apiClient.post('/mpesa/buy-crypto', data);
    return response.data;
  },

  // Crypto to Fiat (Off-Ramp)
  withdraw: async (data: WithdrawData): Promise<ApiResponse> => {
    const response = await apiClient.post('/mpesa/withdraw', data);
    return response.data;
  },

  // Crypto to M-Pesa (Send crypto, recipient gets M-Pesa)
  cryptoToMpesa: async (data: CryptoToMpesaData): Promise<CryptoToMpesaResponse> => {
    try {
      console.log('[mpesa] Initiating crypto-to-mpesa transfer:', {
        amount: data.amount,
        phone: data.phone?.substring(0, 6) + '****',
        tokenType: data.tokenType || 'USDC'
      });

      const response = await apiClient.post('/mpesa/crypto-to-mpesa', data);

      console.log('[mpesa] ✅ Crypto-to-mpesa transfer successful');
      return response.data;
    } catch (error: any) {
      console.error('[mpesa] ❌ Crypto-to-mpesa transfer failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // If it's an auth error, provide more specific guidance
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('[mpesa] Authentication failed - user may need to re-login');
      }

      // If it's a 500 error, it might be a backend issue
      if (error.response?.status === 500) {
        console.error('[mpesa] Backend server error - please try again later');
      }

      throw error;
    }
  },

  // Crypto Bill Payments
  payBill: async (data: PayBillData): Promise<ApiResponse> => {
    const response = await apiClient.post('/mpesa/pay/paybill', data);
    return response.data;
  },

  payTill: async (data: PayTillData): Promise<ApiResponse> => {
    const response = await apiClient.post('/mpesa/pay/till', data);
    return response.data;
  },

  payWithCrypto: async (data: PayWithCryptoData): Promise<ApiResponse> => {
    try {
      console.log('Making payWithCrypto API call with data:', data);
      console.log('API client headers:', apiClient.defaults.headers);

      // Ensure Authorization header is attached explicitly for this call
      const rawToken =
        localStorage.getItem('nexuspay_token') ||
        localStorage.getItem('user') ||
        localStorage.getItem('nexuspay_user');
      let authHeader: string | undefined;
      if (rawToken) {
        try {
          let tokenCandidate: string = rawToken;
          if (tokenCandidate.startsWith('{')) {
            const parsed = JSON.parse(tokenCandidate);
            tokenCandidate = parsed?.data?.token || parsed?.token || '';
          }
          tokenCandidate = tokenCandidate.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '');
          if (tokenCandidate) authHeader = `Bearer ${tokenCandidate}`;
        } catch (_) {
          const sanitized = rawToken.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '');
          authHeader = `Bearer ${sanitized}`;
        }
      }

      const response = await apiClient.post('/mpesa/pay-with-crypto', data, {
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      console.log('payWithCrypto API response:', response);
      return response.data;
    } catch (error: any) {
      console.error('payWithCrypto API error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Full error object:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  },

  // Transaction Management
  getTransactionStatus: async (id: string): Promise<ApiResponse<TransactionStatus>> => {
    const response = await apiClient.get(`/mpesa/transaction/${id}`);
    return response.data;
  },

  submitReceipt: async (data: SubmitReceiptData): Promise<ApiResponse> => {
    const response = await apiClient.post('/mpesa/submit-receipt', data);
    return response.data;
  },

  getPendingInterventions: async (): Promise<ApiResponse<PendingIntervention[]>> => {
    const response = await apiClient.get('/mpesa/pending-interventions');
    return response.data;
  },
};