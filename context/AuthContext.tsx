"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { generateMockUser, createMockResponse, simulateDelay, MockUser } from "../lib/mock-data";

// Re-export User type for compatibility
export type User = MockUser;

// Mock token and user utilities
const tokenUtils = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dotpay_token', token);
    }
  },
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dotpay_token');
    }
    return null;
  },
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dotpay_token');
    }
  },
  isTokenValid: (): boolean => {
    return !!tokenUtils.getToken();
  },
};

const userUtils = {
  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dotpay_user', JSON.stringify(user));
    }
  },
  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('dotpay_user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },
  removeUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dotpay_user');
    }
  },
  isAuthenticated: (): boolean => {
    return tokenUtils.isTokenValid() && userUtils.getUser() !== null;
  },
};

// Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // Registration flow
  register: (data: any) => Promise<any>;
  verifyEmail: (data: any) => Promise<any>;
  verifyPhone: (data: any) => Promise<any>;
  
  // Login flow
  login: (data: any) => Promise<any>;
  verifyLogin: (data: any) => Promise<any>;
  
  // Password reset
  requestPasswordReset: (data: any) => Promise<any>;
  resetPassword: (data: any) => Promise<any>;
  
  // Google authentication
  googleAuth: (data: any) => Promise<any>;
  linkGoogle: (data: any) => Promise<any>;
  getGoogleConfig: () => Promise<any>;
  
  // User profile
  getUserProfile: () => Promise<any>;
  
  // Logout
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (userUtils.isAuthenticated()) {
          const userData = userUtils.getUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid data
        tokenUtils.removeToken();
        userUtils.removeUser();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Helper function to handle successful authentication
  const handleAuthSuccess = (response: any) => {
    console.log("Processing auth success with response:", response);
    
    // Extract token from multiple possible locations
    const token = (response as any)?.data?.token || 
                 (response as any)?.token || 
                 (response as any)?.data?.data?.token ||
                 (response as any)?.data?.accessToken ||
                 (response as any)?.accessToken;
    
    if (token) {
      // Extract user data from response
      const responseData = (response as any).data || response;
      const userFromResponse = (responseData as any).user || responseData;
      
      const userData: User = {
        email: (responseData as any).email || userFromResponse?.email || '',
        phoneNumber: (responseData as any).phoneNumber || userFromResponse?.phoneNumber || '',
        arbitrumWallet: (responseData as any).arbitrumWallet || userFromResponse?.arbitrumWallet || (responseData as any).walletAddress || (responseData as any).wallets?.evm || '',
        celoWallet: (responseData as any).celoWallet || userFromResponse?.celoWallet || (responseData as any).walletAddress || (responseData as any).wallets?.evm || '',
        walletAddress: (responseData as any).walletAddress || (responseData as any).arbitrumWallet || userFromResponse?.arbitrumWallet || (responseData as any).wallets?.evm || '', // fallback for compatibility
        stellarAccountId: (responseData as any).stellarAccountId || (responseData as any).wallets?.stellar || '',
        token,
      };
      
      console.log("Storing user data:", userData);
      
      tokenUtils.setToken(token);
      userUtils.setUser(userData);
      setUser(userData);
      
      // Preload balance data in background for faster loading (temporarily disabled)
      // preloadBalanceAfterLogin().catch(error => {
      //   console.error('Failed to preload balance after login:', error);
      // });
      
      toast.success((response as any).message || 'Authentication successful');
      return userData;
    } else {
      console.error("No token found in response:", response);
      throw new Error("Authentication failed - no token received");
    }
  };

  // Registration (using initiate for backward compatibility)
  const register = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(800);
      
      const response = createMockResponse(
        { registrationId: `reg_${Date.now()}`, verificationMethod: data.verifyWith || 'email' },
        'Registration initiated successfully. Please verify your email or phone.'
      );
      
      toast.success(response.message);
      return response;
    } catch (error: any) {
      toast.error('Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(800);
      
      const mockUser = generateMockUser(data.email);
      const response = createMockResponse({
        token: mockUser.token,
        email: mockUser.email,
        arbitrumWallet: mockUser.arbitrumWallet,
        celoWallet: mockUser.celoWallet,
        walletAddress: mockUser.walletAddress,
        user: mockUser,
      }, 'Email verified successfully');
      
      return handleAuthSuccess(response);
    } catch (error: any) {
      toast.error('Email verification failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify phone
  const verifyPhone = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(800);
      
      const mockUser = generateMockUser(undefined, data.phoneNumber);
      const response = createMockResponse({
        token: mockUser.token,
        phoneNumber: mockUser.phoneNumber,
        arbitrumWallet: mockUser.arbitrumWallet,
        celoWallet: mockUser.celoWallet,
        walletAddress: mockUser.walletAddress,
        user: mockUser,
      }, 'Phone verified successfully');
      
      return handleAuthSuccess(response);
    } catch (error: any) {
      toast.error('Phone verification failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(800);
      
      const response = createMockResponse(
        { verificationMethod: data.email ? 'email' : 'phone' },
        'OTP sent successfully. Please check your email or phone.'
      );
      
      toast.success(response.message);
      return response;
    } catch (error: any) {
      toast.error('Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify login
  const verifyLogin = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(800);
      
      const mockUser = generateMockUser(data.email, data.phoneNumber);
      const response = createMockResponse({
        token: mockUser.token,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        arbitrumWallet: mockUser.arbitrumWallet,
        celoWallet: mockUser.celoWallet,
        walletAddress: mockUser.walletAddress,
        user: mockUser,
      }, 'Login successful');
      
      return handleAuthSuccess(response);
    } catch (error: any) {
      toast.error('Login verification failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(800);
      
      const response = createMockResponse(
        {},
        'Password reset OTP sent to your email'
      );
      
      toast.success(response.message);
      return response;
    } catch (error: any) {
      toast.error('Password reset request failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(800);
      
      const response = createMockResponse(
        {},
        'Password reset successfully'
      );
      
      toast.success(response.message);
      return response;
    } catch (error: any) {
      toast.error('Password reset failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google authentication
  const googleAuth = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(1000);
      
      const mockUser = generateMockUser('google@example.com');
      mockUser.googleId = 'google_' + Date.now();
      const response = createMockResponse({
        token: mockUser.token,
        email: mockUser.email,
        arbitrumWallet: mockUser.arbitrumWallet,
        celoWallet: mockUser.celoWallet,
        walletAddress: mockUser.walletAddress,
        user: mockUser,
      }, 'Google authentication successful');
      
      return handleAuthSuccess(response);
    } catch (error: any) {
      toast.error('Google authentication failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Link Google account
  const linkGoogle = async (data: any) => {
    try {
      setLoading(true);
      await simulateDelay(800);
      
      const response = createMockResponse(
        {},
        'Google account linked successfully'
      );
      
      toast.success(response.message);
      return response;
    } catch (error: any) {
      toast.error('Failed to link Google account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get Google config
  const getGoogleConfig = async () => {
    try {
      await simulateDelay(300);
      return createMockResponse({
        clientId: 'mock-google-client-id',
        redirectUri: typeof window !== 'undefined' ? window.location.origin + '/login' : '',
      }, 'Google config loaded');
    } catch (error: any) {
      toast.error('Failed to get Google configuration');
      throw error;
    }
  };

  // Get user profile
  const getUserProfile = async () => {
    try {
      // Since the backend endpoint doesn't exist yet, return the current user data
      const profileData = {
        id: user?.id,
        email: user?.email,
        phoneNumber: user?.phoneNumber,
        googleId: user?.googleId,
        arbitrumWallet: user?.arbitrumWallet,
        celoWallet: user?.celoWallet,
        walletAddress: user?.walletAddress,
        authMethods: user?.phoneNumber ? ['phone'] : [],
        ...(user?.email && { authMethods: [...(user?.phoneNumber ? ['phone'] : []), 'email'] })
      };
      
      return {
        success: true,
        data: profileData,
        message: 'Profile loaded successfully'
      };
    } catch (error: any) {
      console.error("Failed to get user profile:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await simulateDelay(300);
    } catch (error) {
      // Continue with local logout
      console.error('Logout error:', error);
    } finally {
      tokenUtils.removeToken();
      userUtils.removeUser();
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user && userUtils.isAuthenticated(),
    register,
    verifyEmail,
    verifyPhone,
    login,
    verifyLogin,
    requestPasswordReset,
    resetPassword,
    googleAuth,
    linkGoogle,
    getGoogleConfig,
    getUserProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
