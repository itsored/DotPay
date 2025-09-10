import api from './api';

// Types for Business Finance API
export interface TokenBalance {
  balance: number;
  usdValue: number;
  kesValue: number;
  price: number;
  contractAddress?: string;
}

export interface ChainBalances {
  USDC: TokenBalance;
  USDT: TokenBalance;
  DAI?: TokenBalance;
  WBTC?: TokenBalance;
  WETH?: TokenBalance;
  ARB?: TokenBalance;
  MATIC?: TokenBalance;
  OP?: TokenBalance;
  CELO?: TokenBalance;
}

export interface BusinessBalanceOverview {
  totalUSDValue: number;
  totalKESValue: number;
  activeChains: string[];
  totalTokens: Record<string, number>;
  lastUpdated: string;
}

export interface BusinessBalanceSummary {
  totalChains: number;
  activeChainsCount: number;
  totalTokensCount: number;
  supportedTokens: string[];
}

export interface BusinessBalance {
  businessId: string;
  businessName: string;
  merchantId: string;
  walletAddress: string;
  overview: BusinessBalanceOverview;
  balances: {
    arbitrum: ChainBalances;
    base: ChainBalances;
    celo: ChainBalances;
    polygon: ChainBalances;
    optimism: ChainBalances;
  };
  summary: BusinessBalanceSummary;
}

export interface ChainInfo {
  name: string;
  chainId: number;
  nativeToken: string;
  explorer: string;
}

export interface ChainSpecificBalance {
  businessId: string;
  businessName: string;
  merchantId: string;
  walletAddress: string;
  chain: string;
  chainInfo: ChainInfo;
  balances: ChainBalances;
  summary: {
    totalUSDValue: number;
    totalKESValue: number;
    tokensWithBalance: number;
    supportedTokens: string[];
  };
  lastUpdated: string;
}

export interface BusinessTransaction {
  _id: string;
  transactionId: string;
  userId: string;
  businessId: string;
  amount: number;
  type: string;
  status: 'pending' | 'completed' | 'failed' | 'error';
  fromAddress: string;
  toAddress: string;
  tokenType: string;
  chain: string;
  cryptoTransactionHash?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BusinessTransactionHistory {
  transactions: BusinessTransaction[];
  summary: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    businessId: string;
    businessName: string;
  };
}

export interface WithdrawToPersonalRequest {
  businessId: string;
  amount: number;
  tokenType: string;
  chain: string;
}

export interface WithdrawToPersonalResponse {
  transactionId: string;
  amount: number;
  tokenType: string;
  chain: string;
  fromBusiness: string;
  toPersonal: string;
}

export interface WithdrawToMpesaRequest {
  businessId: string;
  amount: number;
  phoneNumber: string;
  tokenType: string;
  chain: string;
}

export interface WithdrawToMpesaResponse {
  transactionId: string;
  amount: number;
  tokenType: string;
  chain: string;
  phoneNumber: string;
  businessName: string;
  status: string;
}

export interface BusinessCreditScore {
  businessId: string;
  businessName: string;
  creditScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  creditLimit: number;
  currentCredit: number;
  availableCredit: number;
  totalVolume: number;
  monthlyVolume: number;
  paymentHistory: {
    totalPayments: number;
    completedPayments: number;
    successRate: number;
  };
  lastAssessment: string;
  recommendations: string[];
}

export interface LoanApplicationRequest {
  businessId: string;
  loanAmount: number;
  purpose: string;
  repaymentPeriod: number;
}

export interface LoanApplication {
  loanId: string;
  businessId: string;
  businessName: string;
  loanAmount: number;
  purpose: string;
  repaymentPeriod: number;
  creditScore: number;
  riskLevel: string;
  status: string;
  appliedAt: string;
  interestRate: number;
  monthlyPayment: number;
}

export interface LoanApplicationResponse {
  loanApplication: LoanApplication;
  estimatedApprovalTime: string;
  nextSteps: string[];
}

// Business Finance API Class
export class BusinessFinanceAPI {
  // 1. Business Balance Management
  static async getBusinessBalance(businessId: string): Promise<{
    success: boolean;
    message: string;
    data?: BusinessBalance;
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching business balance for businessId:', businessId);
      console.log('🔍 API endpoint:', `/business/${businessId}/balance`);
      console.log('🔍 Full URL will be:', `${api.defaults.baseURL}/business/${businessId}/balance`);
      
      const response = await api.get(`/business/${businessId}/balance`);
      console.log('✅ Business balance API response:', response.data);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response headers:', response.headers);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get business balance:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      return {
        success: false,
        message: 'Failed to retrieve business balance',
        error: error?.response?.data?.message || error.message
      };
    }
  }

  // 1.1. Get Business Balance for Specific Chain
  static async getBusinessBalanceByChain(businessId: string, chain: string): Promise<{
    success: boolean;
    message: string;
    data?: ChainSpecificBalance;
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching business balance for chain:', chain, 'businessId:', businessId);
      console.log('🔍 API endpoint:', `/business/${businessId}/balance/${chain}`);
      console.log('🔍 Full URL will be:', `${api.defaults.baseURL}/business/${businessId}/balance/${chain}`);
      
      const response = await api.get(`/business/${businessId}/balance/${chain}`);
      console.log('✅ Business balance for chain API response:', response.data);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response headers:', response.headers);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get business balance for chain:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      return {
        success: false,
        message: 'Failed to retrieve business balance for chain',
        error: error?.response?.data?.message || error.message
      };
    }
  }

  // 2. Business Transaction History
  static async getBusinessTransactionHistory(
    businessId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<{
    success: boolean;
    message: string;
    data?: BusinessTransactionHistory;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.status) params.append('status', options.status);
      if (options.type) params.append('type', options.type);
      if (options.dateFrom) params.append('dateFrom', options.dateFrom);
      if (options.dateTo) params.append('dateTo', options.dateTo);

      const queryString = params.toString();
      const url = `/business/${businessId}/transactions${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get business transaction history:', error);
      return {
        success: false,
        message: 'Failed to retrieve business transaction history',
        error: error?.response?.data?.message || error.message
      };
    }
  }

  // 3. Business Withdrawal Endpoints
  static async withdrawToPersonal(request: WithdrawToPersonalRequest): Promise<{
    success: boolean;
    message: string;
    data?: WithdrawToPersonalResponse;
    error?: string;
  }> {
    try {
      const response = await api.post('/business/withdraw-to-personal', request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to withdraw to personal account:', error);
      return {
        success: false,
        message: 'Failed to transfer to personal account',
        error: error?.response?.data?.message || error.message
      };
    }
  }

  static async withdrawToMpesa(request: WithdrawToMpesaRequest): Promise<{
    success: boolean;
    message: string;
    data?: WithdrawToMpesaResponse;
    error?: string;
  }> {
    try {
      const response = await api.post('/business/withdraw-to-mpesa', request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to withdraw to MPESA:', error);
      return {
        success: false,
        message: 'Failed to withdraw to MPESA',
        error: error?.response?.data?.message || error.message
      };
    }
  }

  // 4. Business Credit & Loan Management
  static async getBusinessCreditScore(businessId: string): Promise<{
    success: boolean;
    message: string;
    data?: BusinessCreditScore;
    error?: string;
  }> {
    try {
      const response = await api.get(`/business/${businessId}/credit-score`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get business credit score:', error);
      return {
        success: false,
        message: 'Failed to retrieve business credit score',
        error: error?.response?.data?.message || error.message
      };
    }
  }

  static async applyForLoan(request: LoanApplicationRequest): Promise<{
    success: boolean;
    message: string;
    data?: LoanApplicationResponse;
    error?: string;
  }> {
    try {
      const response = await api.post('/business/apply-loan', request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to apply for loan:', error);
      return {
        success: false,
        message: 'Failed to submit loan application',
        error: error?.response?.data?.message || error.message
      };
    }
  }
}

// Export the API instance
export const businessFinanceAPI = BusinessFinanceAPI;
