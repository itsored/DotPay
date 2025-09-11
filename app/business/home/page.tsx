"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBusiness } from '@/context/BusinessContext';
import { useAuth } from '@/context/AuthContext';
import { businessActionsAPI, BusinessDetails, BusinessStatus } from '@/lib/business-actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BusinessOverdraft } from '@/components/business/BusinessOverdraft';
import { BusinessAnalytics } from '@/components/business/BusinessAnalytics';
import { BusinessTransactions } from '@/components/transactions/BusinessTransactions';
import { BusinessQRCode } from '@/components/business/BusinessQRCode';
import { BusinessWithdrawal } from '@/components/business/BusinessWithdrawal';
import { BusinessCreditScore } from '@/components/business/BusinessCreditScore';
import { BusinessLoanApplication } from '@/components/business/BusinessLoanApplication';
import { BusinessBalanceOverview } from '@/components/business/BusinessBalanceOverview';
import { useBusinessFinance } from '@/hooks/useBusinessFinance';
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Users, 
  ArrowLeft,
  Settings,
  Wallet,
  BarChart3,
  Receipt,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function BusinessHomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    currentBusiness,
    switchToPersonal,
    isPinVerified
  } = useBusiness();
  
  const {
    businessBalance,
    balanceLoading,
    balanceError,
    getBusinessBalance
  } = useBusinessFinance();

  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'balance' | 'analytics' | 'overdraft' | 'transactions' | 'withdraw' | 'credit' | 'loan'>('overview');
  const [showQRCode, setShowQRCode] = useState(false);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  // Reset access check when business or PIN verification changes
  React.useEffect(() => {
    if (currentBusiness && isPinVerified) {
      setHasCheckedAccess(false);
      setIsContextLoading(false);
    }
  }, [currentBusiness, isPinVerified]);

  // Load business data
  useEffect(() => {
    console.log('🏢 BusinessHomePage: useEffect triggered');
    console.log('🏢 currentBusiness:', currentBusiness);
    console.log('🏢 isPinVerified:', isPinVerified);
    
    if (currentBusiness?.businessId && isPinVerified) {
      console.log('🏢 Loading business data and balance for:', currentBusiness.businessId);
      loadBusinessData();
      // Also load business balance
      getBusinessBalance(currentBusiness.businessId);
    } else {
      console.log('🏢 Not loading data - missing businessId or PIN not verified');
    }
  }, [currentBusiness, isPinVerified, getBusinessBalance]);

  // Handle context loading and access control
  React.useEffect(() => {
    console.log('🏢 BusinessHomePage: Access check triggered');
    console.log('🏢 currentBusiness:', currentBusiness?.businessName);
    console.log('🏢 isPinVerified:', isPinVerified);
    console.log('🏢 hasCheckedAccess:', hasCheckedAccess);
    
    // If we've already checked access, don't check again
    if (hasCheckedAccess) {
      console.log('🏢 Access already checked, skipping');
      return;
    }
    
    // If we have both business and PIN verification, grant access
    if (currentBusiness && isPinVerified) {
      console.log('🏢 Business and PIN verified, granting access');
      setIsContextLoading(false);
      setHasCheckedAccess(true);
      return;
    }
    
    // If we don't have business context yet, wait a bit longer
    if (!currentBusiness) {
      console.log('🏢 No business context yet, waiting...');
      const timeout = setTimeout(() => {
        console.log('🏢 Still no business context after timeout, checking again...');
        if (!currentBusiness) {
          console.log('🏢 No business context after extended wait, redirecting to /business');
          setIsContextLoading(false);
          setHasCheckedAccess(true);
          router.push('/business');
        }
      }, 5000); // Wait 5 seconds for business context to load
      
      return () => clearTimeout(timeout);
    }
    
    // If we have business but no PIN verification, wait a bit for PIN to load
    if (currentBusiness && !isPinVerified) {
      console.log('🏢 Business found but PIN not verified yet, waiting...');
      const timeout = setTimeout(() => {
        console.log('🏢 PIN still not verified after timeout');
        if (!isPinVerified) {
          console.log('🏢 PIN not verified after extended wait, redirecting to /business');
          toast({
            title: "PIN Required",
            description: "Please verify your PIN to access business account",
            variant: "destructive",
          });
          setIsContextLoading(false);
          setHasCheckedAccess(true);
          router.push('/business');
        }
      }, 3000); // Wait 3 seconds for PIN verification to load
      
      return () => clearTimeout(timeout);
    }
  }, [currentBusiness, isPinVerified, hasCheckedAccess, router, toast]);

  const loadBusinessData = async () => {
    setIsLoading(true);
    try {
      const [detailsResponse, statusResponse] = await Promise.all([
        businessActionsAPI.getBusinessDetails(),
        businessActionsAPI.getBusinessStatus()
      ]);

      if (detailsResponse.success) {
        setBusinessDetails(detailsResponse.data);
      }

      if (statusResponse.success) {
        setBusinessStatus(statusResponse.data);
      }
    } catch (error) {
      console.error('Failed to load business data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToPersonal = () => {
    switchToPersonal();
    toast({
      title: "Switched to Personal Account",
      description: "You are now using your personal account",
    });
    router.push('/home');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'suspended':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Show loading state while context is loading or if we haven't checked access yet
  if (isContextLoading || (!currentBusiness || !isPinVerified) && !hasCheckedAccess) {
    return (
      <div className="min-h-screen bg-[#0A0E0E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0795B0] mx-auto mb-4"></div>
          <p className="text-white">
            {isContextLoading ? 'Loading business context...' : 'Loading business account...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {!currentBusiness ? 'Setting up business account...' : 'Verifying PIN access...'}
          </p>
          {isContextLoading && (
            <p className="text-gray-500 text-xs mt-2">
              Please wait while we verify your business access
            </p>
          )}
        </div>
      </div>
    );
  }

  // Only redirect if we've checked access and still don't have business or PIN
  if (hasCheckedAccess && (!currentBusiness || !isPinVerified)) {
    // This will be handled by the useEffect, but we need to show something
    return (
      <div className="min-h-screen bg-[#0A0E0E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0795B0] mx-auto mb-4"></div>
          <p className="text-white">Redirecting...</p>
          <p className="text-gray-400 text-sm mt-2">
            {!currentBusiness ? 'No business account found' : 'PIN verification required'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E0E] text-white">
      {/* Header */}
      <div className="bg-[#0A0E0E] border-b border-[#0795B0]/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0795B0]/20 rounded-lg">
              <Building2 className="h-6 w-6 text-[#0795B0]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{currentBusiness?.businessName}</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-300">{currentBusiness?.merchantId}</p>
                <Button
                  onClick={() => copyToClipboard(currentBusiness?.merchantId || '', 'Merchant ID')}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-gray-400 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                loadBusinessData();
                if (currentBusiness?.businessId) {
                  getBusinessBalance(currentBusiness.businessId);
                }
              }}
              variant="outline"
              size="sm"
              className="border-[#0795B0] text-[#0795B0] hover:bg-[#0795B0] hover:text-white bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSwitchToPersonal}
              variant="outline"
              size="sm"
              className="border-[#0795B0] text-[#0795B0] hover:bg-[#0795B0] hover:text-white bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Personal Account
            </Button>
            <Button
              onClick={() => router.push('/settings')}
              variant="outline"
              size="sm"
              className="border-[#0795B0] text-[#0795B0] hover:bg-[#0795B0] hover:text-white bg-transparent"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Business Balance Overview */}
      <div className="p-4">
        <BusinessBalanceOverview />
      </div>

      {/* Navigation Tabs */}
      <div className="px-4">
        <div className="flex space-x-1 bg-[#0795B0]/10 p-1 rounded-lg overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'balance', label: 'Balance', icon: Wallet },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'overdraft', label: 'Credit', icon: CreditCard },
            { id: 'transactions', label: 'Transactions', icon: Receipt },
            { id: 'withdraw', label: 'Withdraw', icon: TrendingUp },
            { id: 'credit', label: 'Credit Score', icon: Shield },
            { id: 'loan', label: 'Apply Loan', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0795B0] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#0795B0]/20'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => setShowQRCode(true)}
                className="h-20 bg-[#0795B0]/10 border border-[#0795B0] hover:bg-[#0795B0]/20 text-white flex flex-col items-center gap-2"
              >
                <CreditCard className="h-6 w-6" />
                <span>Accept Payment</span>
              </Button>
              <Button
                onClick={() => setActiveTab('balance')}
                className="h-20 bg-[#0795B0]/10 border border-[#0795B0] hover:bg-[#0795B0]/20 text-white flex flex-col items-center gap-2"
              >
                <Wallet className="h-6 w-6" />
                <span>Balance</span>
              </Button>
              <Button
                onClick={() => setActiveTab('transactions')}
                className="h-20 bg-[#0795B0]/10 border border-[#0795B0] hover:bg-[#0795B0]/20 text-white flex flex-col items-center gap-2"
              >
                <Receipt className="h-6 w-6" />
                <span>Transactions</span>
              </Button>
              <Button
                onClick={() => setActiveTab('analytics')}
                className="h-20 bg-[#0795B0]/10 border border-[#0795B0] hover:bg-[#0795B0]/20 text-white flex flex-col items-center gap-2"
              >
                <BarChart3 className="h-6 w-6" />
                <span>Analytics</span>
              </Button>
            </div>

            {/* Business Details */}
            <div className="bg-[#0795B0]/5 border border-[#0795B0]/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Business Type:</span>
                  <span className="text-white font-medium capitalize">
                    {currentBusiness?.businessType?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone Number:</span>
                  <span className="text-white font-medium">{currentBusiness?.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white font-medium">
                    {businessDetails?.createdAt 
                      ? new Date(businessDetails.createdAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">PIN Status:</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Set</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="space-y-6">
            <BusinessBalanceOverview />
          </div>
        )}

        {activeTab === 'analytics' && <BusinessAnalytics />}
        {activeTab === 'overdraft' && <BusinessOverdraft />}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <BusinessTransactions />
          </div>
        )}
        {activeTab === 'withdraw' && (
          <div className="space-y-6">
            <BusinessWithdrawal />
          </div>
        )}
        {activeTab === 'credit' && (
          <div className="space-y-6">
            <BusinessCreditScore onLoanApplication={() => setActiveTab('loan')} />
          </div>
        )}
        {activeTab === 'loan' && (
          <div className="space-y-6">
            <BusinessLoanApplication onBack={() => setActiveTab('credit')} />
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <BusinessQRCode onClose={() => setShowQRCode(false)} />
      )}
    </div>
  );
}
