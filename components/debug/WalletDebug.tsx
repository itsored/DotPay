"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

const WalletDebug: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { wallet, refreshWallet, loading, refreshing } = useWallet();

  const testWalletAPI = async () => {
    console.log("Testing wallet API...");
    try {
      await refreshWallet();
    } catch (error) {
      console.error("Wallet API test failed:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-4">Wallet Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
        </div>
        
        <div>
          <strong>User Email:</strong> {user?.email || "Not available"}
        </div>
        
        <div>
          <strong>User Phone:</strong> {user?.phoneNumber || "Not available"}
        </div>
        
        <div>
          <strong>Arbitrum Wallet:</strong> {user?.arbitrumWallet || "Not available"}
        </div>
        
        <div>
          <strong>Celo Wallet:</strong> {user?.celoWallet || "Not available"}
        </div>
        
        <div>
          <strong>Token Available:</strong> {user?.token ? "Yes" : "No"}
        </div>
        
        <div>
          <strong>Token in localStorage:</strong> {localStorage.getItem('dotpay_token') ? "Yes" : "No"}
        </div>
        
        <div>
          <strong>Wallet Data:</strong> {wallet ? "Loaded" : "Not loaded"}
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? "Yes" : "No"}
        </div>
        
        <div>
          <strong>Refreshing:</strong> {refreshing ? "Yes" : "No"}
        </div>
      </div>
      
      <button
        onClick={testWalletAPI}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={refreshing}
      >
        {refreshing ? "Testing..." : "Test Wallet API"}
      </button>
      
      {wallet && (
        <div className="mt-4 p-2 bg-gray-700 rounded">
          <strong>Wallet Data:</strong>
          <pre className="text-xs mt-2 overflow-auto">
            {JSON.stringify(wallet, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default WalletDebug;