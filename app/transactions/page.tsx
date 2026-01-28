"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TransactionHistory } from '../../components/transactions/TransactionHistory';
import { TransactionAnalytics } from '../../components/transactions/TransactionAnalytics';
import { TransactionExport } from '../../components/transactions/TransactionExport';
import { useAuthSession } from '../../context/AuthSessionContext';

const TransactionsPage: React.FC = () => {
  const { isLoggedIn } = useAuthSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'history' | 'analytics' | 'export'>('history');
  
  console.log('🏠 TransactionsPage: Component rendered');

  const handleBackToHome = () => {
    router.push('/home');
  };
  
  // Admin-specific analytics are disabled for now without a user profile
  const isAdmin = false;
  
  const tabs = [
    { id: 'history', label: 'Transaction History', icon: '📋' },
    ...(isAdmin ? [
      { id: 'analytics', label: 'Analytics', icon: '📊' },
      { id: 'export', label: 'Export Data', icon: '📤' },
    ] : []),
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E0E] via-[#0F1419] to-[#0A0E0E] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToHome}
            className="flex items-center text-white hover:text-[#0795B0] transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft size={24} className="mr-2" />
            <span className="text-lg font-medium">Back to Home</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-gray-400">
            {activeTab === 'history' && 'View and manage all your cryptocurrency transactions'}
            {activeTab === 'analytics' && 'Analyze transaction patterns and performance metrics'}
            {activeTab === 'export' && 'Export transaction data for external analysis'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-[#1A1E1E] p-1 rounded-lg border border-[#0795B0]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#0795B0] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0A0E0E]'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'history' && (
            <TransactionHistory />
          )}
          
          {activeTab === 'analytics' && isAdmin && (
            <TransactionAnalytics />
          )}
          
          {activeTab === 'export' && isAdmin && (
            <TransactionExport />
          )}
        </div>

      </div>
    </div>
  );
};

export default TransactionsPage;
