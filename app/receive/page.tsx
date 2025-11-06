"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy } from "@phosphor-icons/react";
import QRCode from "qrcode.react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useChain } from "@/context/ChainContext";
import AuthGuard from "@/components/auth/AuthGuard";
import toast from "react-hot-toast";

const Receive: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { wallet, hasWallet, loading, initializeWallet } = useWallet();
  const { chain } = useChain();
  const [initializing, setInitializing] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<'evm' | 'stellar'>('evm');

  // Get wallet address and user info from the new API response
  const walletAddress = wallet?.walletAddress || wallet?.address || user?.walletAddress || "";
  const stellarAddress = user?.stellarAccountId || "";
  const phoneNumber = wallet?.phoneNumber || user?.phoneNumber || "";
  const email = wallet?.email || user?.email || "";
  const supportedChains = wallet?.supportedChains || [];
  const note = wallet?.note || "";
  
  // Get the current display address based on selection
  const currentDisplayAddress = selectedWalletType === 'stellar' ? stellarAddress : walletAddress;

  const copyToClipboard = async (text: string, message = "Copied to clipboard") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // Initialize wallet for new users
  const handleInitializeWallet = async () => {
    try {
      setInitializing(true);
      await initializeWallet();
      toast.success('Wallet set up successfully!');
    } catch (error) {
      // Error already handled in context
    } finally {
      setInitializing(false);
    }
  };

  const formatWalletAddress = (address: string) => {
    return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'No wallet address';
  };

  return (
    <AuthGuard>
      <section className="home-background h-screen flex flex-col p-5 xl:px-[200px]">
        <div className="flex justify-between items-center mb-6">
          <ArrowLeft 
            size={24} 
            color="#ffffff" 
            onClick={() => router.replace("/home")}
            className="cursor-pointer"
          />
          <h3 className="text-white text-lg">Receive Crypto</h3>
          <span></span>
        </div>

        <div className="flex flex-col items-center mt-10">
          <h5 className="text-xl text-white mb-2">Scan to Receive</h5>
          <p className="text-sm text-gray-400 text-center mb-4">
            Share this QR code or wallet address to receive payments
          </p>
          
          {/* Wallet Type Selector */}
          {walletAddress && stellarAddress && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSelectedWalletType('evm')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedWalletType === 'evm'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                EVM Chains
              </button>
              <button
                onClick={() => setSelectedWalletType('stellar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedWalletType === 'stellar'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🌟 Stellar
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-8">
          {loading || initializing ? (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">
                {initializing ? 'Setting up wallet...' : 'Loading wallet...'}
              </p>
            </div>
          ) : currentDisplayAddress ? (
            <div className="bg-white p-4 rounded-lg">
              <QRCode 
                value={currentDisplayAddress} 
                size={200} 
                level={"H"} 
                includeMargin={true} 
              />
              <p className="text-xs text-center mt-2 text-gray-600">
                {selectedWalletType === 'stellar' ? 'Stellar Network' : 'EVM Compatible Chains'}
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <p className="text-gray-400 mb-4">No wallet address available</p>
              <p className="text-sm text-gray-500 mb-4">
                Complete your wallet setup to receive payments
              </p>
              <button
                onClick={handleInitializeWallet}
                disabled={initializing}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {initializing ? 'Setting up...' : 'Set Up Wallet'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* EVM Wallet Address */}
          <div className="flex flex-col">
            <label className="text-[#909090] p-1 text-sm">
              EVM Wallet Address
            </label>
            <div className="flex justify-between items-center border border-[#0795B0] rounded-lg p-3 bg-[#0A0E0E] text-white">
              <span className="flex-1 mr-2 text-sm">
                {walletAddress ? formatWalletAddress(walletAddress) : 'Not available'}
              </span>
              {walletAddress && (
                <Copy 
                  size={20} 
                  color="#ffffff" 
                  onClick={() => copyToClipboard(walletAddress, "EVM wallet address copied!")}
                  className="cursor-pointer hover:text-blue-400"
                />
              )}
            </div>
          </div>

          {/* Stellar Wallet Address */}
          {user?.stellarAccountId && (
            <div className="flex flex-col">
              <label className="text-[#909090] p-1 text-sm flex items-center gap-2">
                🌟 Stellar Wallet Address
              </label>
              <div className="flex justify-between items-center border border-[#0795B0] rounded-lg p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 text-white">
                <span className="flex-1 mr-2 text-sm font-mono">
                  {formatWalletAddress(user.stellarAccountId)}
                </span>
                <Copy 
                  size={20} 
                  color="#ffffff" 
                  onClick={() => copyToClipboard(user.stellarAccountId!, "Stellar wallet address copied!")}
                  className="cursor-pointer hover:text-purple-400"
                />
              </div>
            </div>
          )}

          {/* Phone Number */}
          {phoneNumber && (
            <div className="flex flex-col">
              <label className="text-[#909090] p-1 text-sm">
                Phone Number
              </label>
              <div className="flex justify-between items-center border border-[#0795B0] rounded-lg p-3 bg-[#0A0E0E] text-white">
                <span className="flex-1 mr-2">{phoneNumber}</span>
                <Copy 
                  size={20} 
                  color="#ffffff" 
                  onClick={() => copyToClipboard(phoneNumber, "Phone number copied!")}
                  className="cursor-pointer hover:text-blue-400"
                />
              </div>
            </div>
          )}

          {/* Email */}
          {email && (
            <div className="flex flex-col">
              <label className="text-[#909090] p-1 text-sm">
                Email Address
              </label>
              <div className="flex justify-between items-center border border-[#0795B0] rounded-lg p-3 bg-[#0A0E0E] text-white">
                <span className="flex-1 mr-2">{email}</span>
                <Copy 
                  size={20} 
                  color="#ffffff" 
                  onClick={() => copyToClipboard(email, "Email copied!")}
                  className="cursor-pointer hover:text-blue-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Supported Chains */}
        {supportedChains.length > 0 && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-semibold mb-3">Supported Networks:</h4>
            <div className="grid grid-cols-2 gap-2">
              {supportedChains.map((chain) => (
                <div key={chain.id} className="flex items-center space-x-2 p-2 bg-gray-700 rounded">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">{chain.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {note && (
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200">{note}</p>
          </div>
        )}


      </section>
    </AuthGuard>
  );
};

export default Receive;