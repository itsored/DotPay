"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { businessV2API, BusinessAccount } from '@/lib/business-v2';
import { businessPinAPI } from '@/lib/business-pin';

export interface BusinessPinSession {
  verified: boolean;
  verifiedAt: string;
  expiresAt: string;
  businessId: string;
  businessName: string;
  merchantId: string;
}

interface BusinessContextType {
  // Business accounts
  businessAccounts: BusinessAccount[];
  currentBusiness: BusinessAccount | null;
  isLoadingBusinesses: boolean;
  
  // PIN verification
  pinSession: BusinessPinSession | null;
  isPinVerified: boolean;
  
  // Actions
  loadBusinessAccounts: () => Promise<void>;
  switchToBusiness: (businessId: string) => Promise<void>;
  switchToPersonal: () => void;
  verifyBusinessPin: (businessId: string, pin: string) => Promise<boolean>;
  setBusinessPin: (businessId: string, pin: string) => Promise<boolean>;
  requestPinSetupOtp: (businessId: string) => Promise<boolean>;
  setBusinessPinWithOtp: (businessId: string, otp: string, pin: string) => Promise<boolean>;
  updateBusinessPin: (businessId: string, oldPin: string, newPin: string) => Promise<boolean>;
  forgotBusinessPin: (merchantId: string, phoneNumber: string, otp: string, newPin: string) => Promise<boolean>;
  requestPinResetOtp: (merchantId?: string, phoneNumber?: string) => Promise<boolean>;
  
  // PIN session management
  clearPinSession: () => void;
  checkPinSessionExpiry: () => boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [businessAccounts, setBusinessAccounts] = useState<BusinessAccount[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessAccount | null>(null);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false);
  const [pinSession, setPinSession] = useState<BusinessPinSession | null>(null);

  // Check if PIN session is still valid
  const checkPinSessionExpiry = (): boolean => {
    if (!pinSession) return false;
    
    const expiresAt = new Date(pinSession.expiresAt);
    return new Date() < expiresAt;
  };

  const isPinVerified = pinSession ? checkPinSessionExpiry() : false;

  // Load user's business accounts
  const loadBusinessAccounts = async (): Promise<void> => {
    if (!user?.id && !user?.email && !user?.phoneNumber) {
      console.log('No user authentication data found');
      return;
    }
    
    setIsLoadingBusinesses(true);
    try {
      console.log('Loading business accounts for user:', user.id || user.email || user.phoneNumber);
      
      const response = await businessV2API.getUserBusinesses();
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        console.log('Business accounts found:', response.data.businesses);
        setBusinessAccounts(response.data.businesses);
      } else {
        console.error('Failed to load business accounts:', response.message);
        setBusinessAccounts([]);
      }
    } catch (error) {
      console.error('Failed to load business accounts:', error);
      setBusinessAccounts([]);
    } finally {
      setIsLoadingBusinesses(false);
    }
  };

  // Switch to business account
  const switchToBusiness = async (businessId: string): Promise<void> => {
    console.log('BusinessContext - switching to business:', businessId);
    const business = businessAccounts.find(b => b.businessId === businessId);
    if (!business) {
      console.error('Business account not found for ID:', businessId);
      throw new Error('Business account not found');
    }
    
    console.log('BusinessContext - setting current business:', business.businessName);
    setCurrentBusiness(business);
    
    // Ensure PIN session is linked to the correct business
    if (pinSession && pinSession.businessId === businessId) {
      console.log('BusinessContext - PIN session already linked to business');
    } else {
      console.log('BusinessContext - PIN session not linked to business, this should not happen after PIN verification');
    }
    
    console.log('BusinessContext - business switch completed');
  };

  // Switch to personal account
  const switchToPersonal = (): void => {
    setCurrentBusiness(null);
    setPinSession(null);
  };

  // Verify business PIN
  const verifyBusinessPin = async (businessId: string, pin: string): Promise<boolean> => {
    try {
      console.log('BusinessContext - verifying PIN for business:', businessId);
      const response = await businessPinAPI.verifyPin({ businessId, pin });
      console.log('BusinessContext - PIN verification response:', response);
      
      if (response.success && response.data && response.data.verified) {
        console.log('BusinessContext - Setting PIN session:', response.data);
        
        // Calculate expiration time (30 minutes from now)
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        
        // Find the business to get additional details
        const business = businessAccounts.find(b => b.businessId === businessId);
        
        const newPinSession = {
          verified: true,
          verifiedAt: response.data.verifiedAt,
          expiresAt: expiresAt,
          businessId: businessId,
          businessName: business?.businessName || '',
          merchantId: business?.merchantId || '',
        };
        
        setPinSession(newPinSession);
        
        // Also set the current business immediately to ensure state consistency
        if (business) {
          setCurrentBusiness(business);
          console.log('BusinessContext - Current business set during PIN verification:', business.businessName);
        }
        
        console.log('BusinessContext - PIN verification successful, returning true');
        return true;
      }
      console.log('BusinessContext - PIN verification failed, returning false');
      return false;
    } catch (error) {
      console.error('Failed to verify business PIN:', error);
      return false;
    }
  };

  // Request OTP for PIN setting
  const requestPinSetupOtp = async (businessId: string): Promise<boolean> => {
    try {
      const business = businessAccounts.find(b => b.businessId === businessId);
      if (!business || !business.merchantId || !business.phoneNumber) {
        console.error('Business not found or missing required data for businessId:', businessId);
        return false;
      }
      
      console.log('Requesting OTP for business:', business.merchantId, business.phoneNumber);
      const response = await businessPinAPI.requestOtp({
        merchantId: business.merchantId,
        phoneNumber: business.phoneNumber
      });
      
      return response.success;
    } catch (error: any) {
      console.error('Failed to request PIN setup OTP:', error);
      return false;
    }
  };

  // Set business PIN with OTP
  const setBusinessPinWithOtp = async (businessId: string, otp: string, pin: string): Promise<boolean> => {
    try {
      const business = businessAccounts.find(b => b.businessId === businessId);
      if (!business || !business.merchantId || !business.phoneNumber) {
        console.error('Business not found or missing required data for businessId:', businessId);
        return false;
      }
      
      console.log('Setting business PIN with OTP for:', business.merchantId);
      const response = await businessPinAPI.setPin({
        merchantId: business.merchantId,
        phoneNumber: business.phoneNumber,
        otp,
        pin
      });
      
      return response.success;
    } catch (error: any) {
      console.error('Failed to set business PIN with OTP:', error);
      console.error('Error response data:', error?.response?.data);
      return false;
    }
  };

  // Legacy method for backward compatibility
  const setBusinessPin = async (businessId: string, pin: string): Promise<boolean> => {
    console.warn('setBusinessPin called - this now requires OTP flow');
    return false;
  };

  // Update business PIN
  const updateBusinessPin = async (businessId: string, oldPin: string, newPin: string): Promise<boolean> => {
    try {
      const response = await businessPinAPI.updatePin({ businessId, oldPin, newPin });
      return response.success;
    } catch (error) {
      console.error('Failed to update business PIN:', error);
      return false;
    }
  };

  // Request PIN reset OTP
  const requestPinResetOtp = async (merchantId?: string, phoneNumber?: string): Promise<boolean> => {
    try {
      const response = await businessPinAPI.forgotPinRequest({ merchantId, phoneNumber });
      return response.success;
    } catch (error) {
      console.error('Failed to request PIN reset OTP:', error);
      return false;
    }
  };

  // Forgot business PIN (confirm with OTP)
  const forgotBusinessPin = async (merchantId: string, phoneNumber: string, otp: string, newPin: string): Promise<boolean> => {
    try {
      const response = await businessPinAPI.forgotPinConfirm({ merchantId, phoneNumber, otp, newPin });
      return response.success;
    } catch (error) {
      console.error('Failed to reset business PIN:', error);
      return false;
    }
  };

  // Clear PIN session
  const clearPinSession = (): void => {
    setPinSession(null);
  };

  // Load business accounts when user changes
  useEffect(() => {
    const isAuthenticated = user?.id || user?.email || user?.phoneNumber;
    if (isAuthenticated) {
      console.log('User authenticated, loading business accounts for:', user.id || user.email || user.phoneNumber);
      loadBusinessAccounts();
    } else {
      console.log('User not authenticated, clearing business accounts');
      setBusinessAccounts([]);
      setCurrentBusiness(null);
      setPinSession(null);
    }
  }, [user?.id, user?.email, user?.phoneNumber]);

  // Also load businesses when the component mounts and user is already authenticated
  useEffect(() => {
    const isAuthenticated = user?.id || user?.email || user?.phoneNumber;
    if (isAuthenticated && businessAccounts.length === 0 && !isLoadingBusinesses) {
      console.log('Component mounted with authenticated user, loading business accounts');
      loadBusinessAccounts();
    }
  }, []);

  // Check PIN session expiry periodically
  useEffect(() => {
    if (pinSession) {
      const interval = setInterval(() => {
        if (!checkPinSessionExpiry()) {
          setPinSession(null);
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [pinSession]);

  const value: BusinessContextType = {
    businessAccounts,
    currentBusiness,
    isLoadingBusinesses,
    pinSession,
    isPinVerified,
    loadBusinessAccounts,
    switchToBusiness,
    switchToPersonal,
    verifyBusinessPin,
    setBusinessPin,
    requestPinSetupOtp,
    setBusinessPinWithOtp,
    updateBusinessPin,
    forgotBusinessPin,
    requestPinResetOtp,
    clearPinSession,
    checkPinSessionExpiry,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
