import apiClient from './api';

// ================================
// 📦 TYPES & INTERFACES
// ================================

export interface StellarWalletResponse {
  success: boolean;
  message?: string;
  data: {
    accountId: string;
    balances: StellarBalance[];
    sequence: string;
    isActive: boolean;
    createdAt?: string;
  };
}

export interface StellarBalance {
  asset: string; // XLM, USDC, etc.
  balance: string;
  usdValue: number;
}

export interface StellarSecretKeyResponse {
  success: boolean;
  message?: string;
  data: {
    accountId: string;
    secretKey: string;
    warning: string;
  };
}

export interface StellarSendPaymentData {
  toAccountId: string;
  amount: string;
  asset: 'XLM' | 'USDC';
  memo?: string;
}

export interface StellarSendPaymentResponse {
  success: boolean;
  message?: string;
  data: {
    transactionHash: string;
    transactionId: string;
    amount: string;
    asset: string;
    recipient: string;
    fee: string;
    status: string;
  };
}

export interface StellarTransaction {
  id: string;
  hash: string;
  source: string;
  destination: string;
  amount: string;
  asset: {
    code: string;
    issuer?: string;
    type: string;
  };
  fee: string;
  memo?: string;
  createdAt: string;
  status: string;
}

export interface StellarTransactionHistoryResponse {
  success: boolean;
  data: {
    transactions: StellarTransaction[];
    nextCursor?: string;
  };
}

export interface StellarTrustlineData {
  assetCode: string;
  issuer: string;
  limit?: string;
}

export interface StellarValidateAddressData {
  address: string;
}

export interface StellarValidateAddressResponse {
  success: boolean;
  data: {
    valid: boolean;
    address: string;
  };
}

export interface StellarPricesResponse {
  success: boolean;
  data: {
    XLM: {
      usd: number;
      kes: number;
    };
    USDC: {
      usd: number;
      kes: number;
    };
  };
}

export interface StellarNetworkInfoResponse {
  success: boolean;
  data: {
    network: string;
    horizonUrl: string;
    baseFee: number;
    minBalance: number;
    version: string;
  };
}

// M-Pesa Integration Types
export interface StellarMpesaDepositData {
  phoneNumber: string;
  amountKES: number;
  asset: 'XLM' | 'USDC';
  memo?: string;
}

export interface StellarMpesaWithdrawData {
  phoneNumber: string;
  amountAsset: string;
  asset: 'XLM' | 'USDC';
  memo?: string;
}

export interface StellarMpesaRatesResponse {
  success: boolean;
  data: {
    XLM: {
      kes: number;
      usd: number;
    };
    USDC: {
      kes: number;
      usd: number;
    };
  };
}

export interface StellarMpesaConversionData {
  amountKES?: number;
  amountAsset?: string;
  asset: 'XLM' | 'USDC';
}

export interface StellarMpesaTransactionResponse {
  success: boolean;
  data: {
    transactionId: string;
    status: string;
    type: string;
    amountKES?: number;
    amountAsset?: string;
    asset: string;
    stellarTransactionHash?: string;
    mpesaReceiptNumber?: string;
    createdAt: string;
    completedAt?: string;
  };
}

// ================================
// 🌟 STELLAR WALLET MANAGEMENT
// ================================

export const stellarWalletAPI = {
  /**
   * Create a new Stellar wallet
   */
  createWallet: async (): Promise<StellarWalletResponse> => {
    const response = await apiClient.post('/stellar/wallet');
    return response.data;
  },

  /**
   * Get Stellar wallet information
   */
  getWallet: async (): Promise<StellarWalletResponse> => {
    const response = await apiClient.get('/stellar/wallet');
    return response.data;
  },

  /**
   * Get Stellar secret key (SENSITIVE)
   */
  getSecretKey: async (): Promise<StellarSecretKeyResponse> => {
    const response = await apiClient.get('/stellar/secret-key');
    return response.data;
  },

  /**
   * Get balance for a specific asset
   */
  getBalance: async (asset?: 'XLM' | 'USDC'): Promise<any> => {
    const url = asset ? `/stellar/balance?asset=${asset}` : '/stellar/balance';
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get all balances
   */
  getAllBalances: async (): Promise<any> => {
    const response = await apiClient.get('/stellar/balances');
    return response.data;
  },

  /**
   * Fund wallet (Testnet only)
   */
  fundWallet: async (): Promise<any> => {
    const response = await apiClient.post('/stellar/fund');
    return response.data;
  },

  /**
   * Validate Stellar address
   */
  validateAddress: async (data: StellarValidateAddressData): Promise<StellarValidateAddressResponse> => {
    const response = await apiClient.post('/stellar/validate-address', data);
    return response.data;
  },
};

// ================================
// 💸 STELLAR PAYMENTS
// ================================

export const stellarPaymentAPI = {
  /**
   * Send Stellar payment
   */
  sendPayment: async (data: StellarSendPaymentData): Promise<StellarSendPaymentResponse> => {
    const response = await apiClient.post('/stellar/send', data);
    return response.data;
  },

  /**
   * Get transaction history
   */
  getTransactionHistory: async (limit: number = 10, cursor?: string): Promise<StellarTransactionHistoryResponse> => {
    let url = `/stellar/transactions?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Create trustline for an asset
   */
  createTrustline: async (data: StellarTrustlineData): Promise<any> => {
    const response = await apiClient.post('/stellar/trustline', data);
    return response.data;
  },

  /**
   * Get prices
   */
  getPrices: async (asset?: 'XLM' | 'USDC'): Promise<StellarPricesResponse> => {
    const url = asset ? `/stellar/prices?asset=${asset}` : '/stellar/prices';
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get network info
   */
  getNetworkInfo: async (): Promise<StellarNetworkInfoResponse> => {
    const response = await apiClient.get('/stellar/network');
    return response.data;
  },
};

// ================================
// 📱 STELLAR M-PESA INTEGRATION
// ================================

export const stellarMpesaAPI = {
  /**
   * Deposit KES to Stellar (Buy Crypto)
   */
  deposit: async (data: StellarMpesaDepositData): Promise<any> => {
    const response = await apiClient.post('/stellar-mpesa/deposit', data);
    return response.data;
  },

  /**
   * Withdraw from Stellar to M-Pesa (Sell Crypto)
   */
  withdraw: async (data: StellarMpesaWithdrawData): Promise<any> => {
    const response = await apiClient.post('/stellar-mpesa/withdraw', data);
    return response.data;
  },

  /**
   * Get exchange rates
   */
  getRates: async (): Promise<StellarMpesaRatesResponse> => {
    const response = await apiClient.get('/stellar-mpesa/rates');
    return response.data;
  },

  /**
   * Convert KES to Asset
   */
  convertKESToAsset: async (data: { amountKES: number; asset: 'XLM' | 'USDC' }): Promise<any> => {
    const response = await apiClient.post('/stellar-mpesa/convert/kes-to-asset', data);
    return response.data;
  },

  /**
   * Convert Asset to KES
   */
  convertAssetToKES: async (data: { amountAsset: string; asset: 'XLM' | 'USDC' }): Promise<any> => {
    const response = await apiClient.post('/stellar-mpesa/convert/asset-to-kes', data);
    return response.data;
  },

  /**
   * Get transaction status
   */
  getTransactionStatus: async (transactionId: string): Promise<StellarMpesaTransactionResponse> => {
    const response = await apiClient.get(`/stellar-mpesa/transaction/${transactionId}`);
    return response.data;
  },

  /**
   * Get transaction history
   */
  getTransactionHistory: async (limit: number = 10): Promise<any> => {
    const response = await apiClient.get(`/stellar-mpesa/transactions?limit=${limit}`);
    return response.data;
  },
};

// ================================
// 🔧 UTILITY FUNCTIONS
// ================================

export const stellarUtils = {
  /**
   * Format Stellar address for display
   */
  formatAddress: (address: string): string => {
    if (!address || address.length < 12) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  },

  /**
   * Validate Stellar address format
   */
  isValidStellarAddress: (address: string): boolean => {
    // Stellar addresses start with 'G' and are 56 characters long
    return address && address.length === 56 && address.startsWith('G');
  },

  /**
   * Format Stellar amount (7 decimal places)
   */
  formatAmount: (amount: string | number, decimals: number = 7): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num === 0) return '0';
    if (num < 0.0000001) return '< 0.0000001';
    return num.toFixed(decimals);
  },

  /**
   * Format USD value
   */
  formatUSD: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Format KES value
   */
  formatKES: (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Get Stellar explorer URL
   */
  getExplorerUrl: (type: 'account' | 'tx', value: string, network: 'testnet' | 'mainnet' = 'testnet'): string => {
    const baseUrl = `https://stellar.expert/explorer/${network}`;
    return `${baseUrl}/${type}/${value}`;
  },

  /**
   * Get asset display name
   */
  getAssetDisplayName: (assetCode: string): string => {
    const assetNames: { [key: string]: string } = {
      XLM: 'Stellar Lumens',
      USDC: 'USD Coin',
    };
    return assetNames[assetCode] || assetCode;
  },

  /**
   * Get asset icon
   */
  getAssetIcon: (assetCode: string): string => {
    return `/icons/tokens/${assetCode.toLowerCase()}.svg`;
  },

  /**
   * Calculate transaction fee in USD
   */
  calculateFeeInUSD: (fee: string, xlmPrice: number): number => {
    const feeInXLM = parseFloat(fee);
    return feeInXLM * xlmPrice;
  },
};

// ================================
// 🎨 SUPPORTED ASSETS
// ================================

export const STELLAR_SUPPORTED_ASSETS = [
  { code: 'XLM', name: 'Stellar Lumens', native: true, decimals: 7 },
  { code: 'USDC', name: 'USD Coin', native: false, decimals: 7 },
] as const;

// ================================
// 📊 CONSTANTS
// ================================

export const STELLAR_CONSTANTS = {
  MIN_BALANCE: 1, // Minimum XLM balance (base reserve)
  BASE_FEE: 100, // Base fee in stroops (0.00001 XLM)
  MEMO_MAX_LENGTH: 28,
  ADDRESS_LENGTH: 56,
  ADDRESS_PREFIX: 'G',
  NETWORK_PASSPHRASE_TESTNET: 'Test SDF Network ; September 2015',
  NETWORK_PASSPHRASE_MAINNET: 'Public Global Stellar Network ; September 2015',
} as const;

// Export all APIs as a single object for convenience
export const stellarAPI = {
  wallet: stellarWalletAPI,
  payment: stellarPaymentAPI,
  mpesa: stellarMpesaAPI,
  utils: stellarUtils,
};

export default stellarAPI;


