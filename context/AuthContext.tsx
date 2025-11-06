"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, tokenUtils, userUtils, User } from "../lib/auth";
import toast from "react-hot-toast";
import { preloadBalanceAfterLogin } from '@/lib/balance-preloader';

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
      // Use registerInitiate for the first step to maintain compatibility
      const response = await authAPI.registerInitiate(data);
      
      if (response.success) {
        toast.success(response.message);
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyEmail(data);
      
      if (response.success && response.data.token) {
        return handleAuthSuccess(response);
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify phone
  const verifyPhone = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyPhone(data);
      
      if (response.success && response.data.token) {
        return handleAuthSuccess(response);
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Phone verification failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.login(data);
      
      if (response.success) {
        toast.success(response.message);
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify login
  const verifyLogin = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyLogin(data);
      
      console.log("Full OTP verification response:", response);
      
      // Check multiple possible response structures for token
      const token = (response as any)?.data?.token || 
                   (response as any)?.token || 
                   (response as any)?.data?.data?.token ||
                   (response as any)?.data?.accessToken ||
                   (response as any)?.accessToken;
      
      if ((response as any).success && token) {
        return handleAuthSuccess(response);
      } else {
        console.error("No token found in response. Response structure:", response);
        throw new Error("Authentication failed - no token received");
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login verification failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.requestPasswordReset(data);
      
      if (response.success) {
        toast.success(response.message);
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset request failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.resetPassword(data);
      
      if (response.success) {
        toast.success(response.message);
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google authentication
  const googleAuth = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.googleAuth(data);
      
      if (response.success && response.data.token) {
        return handleAuthSuccess(response);
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google authentication failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Link Google account
  const linkGoogle = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.linkGoogle(data);
      
      if (response.success) {
        toast.success(response.message);
      }
      
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to link Google account';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get Google config
  const getGoogleConfig = async () => {
    try {
      const response = await authAPI.getGoogleConfig();
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get Google configuration';
      toast.error(message);
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
      // Call logout endpoint to invalidate token on server
      await authAPI.logout();
    } catch (error) {
      // Continue with local logout even if server call fails
      console.error('Server logout failed:', error);
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
