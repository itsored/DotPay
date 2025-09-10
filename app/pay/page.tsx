"use client";

import React from 'react';
import { PayMerchantForm } from '@/components/crypto/PayMerchantForm';
import { PayWithCryptoForm } from '@/components/mpesa/PayWithCryptoForm';
import { CryptoToMpesaForm } from '@/components/mpesa/CryptoToMpesaForm';
import { QRCodeScanner } from '@/components/crypto/QRCodeScanner';
import { ArrowLeft } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

export default function PayPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<'merchant' | 'bills' | 'crypto-mpesa' | 'scan'>('merchant');
  const [showQRScanner, setShowQRScanner] = React.useState(false);

  const handleBackToHome = () => {
    router.push('/home');
  };

  return (
    <section className="home-background">
      <article className="bg-[#0A0E0E] flex flex-col p-5 xl:px-[200px] border-0 border-b border-[#0795B0]">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackToHome}
            className="flex items-center text-white hover:text-[#0795B0] transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft size={24} className="mr-2" />
            <span className="text-lg font-medium">Back to Home</span>
          </button>
        </div>
        
        <div className="text-center mb-6">
          <h1 className="text-4xl text-white font-bold mb-3">Pay</h1>
          <p className="text-gray-400 text-lg">Pay businesses with crypto or convert to M-Pesa</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-2 flex-wrap">
          <button
            onClick={() => setTab('merchant')}
            className={`px-4 py-2 rounded-md border text-sm ${tab === 'merchant' ? 'bg-[#0795B0] text-white border-[#0795B0]' : 'bg-transparent text-white border-[#0795B0] hover:bg-[#0A0E0E]'}`}
          >
            🔗 Pay Merchant (Crypto)
          </button>
          <button
            onClick={() => setTab('bills')}
            className={`px-4 py-2 rounded-md border text-sm ${tab === 'bills' ? 'bg-[#0795B0] text-white border-[#0795B0]' : 'bg-transparent text-white border-[#0795B0] hover:bg-[#0A0E0E]'}`}
          >
            💰 Pay Bills/Tills (Crypto)
          </button>
          <button
            onClick={() => setTab('crypto-mpesa')}
            className={`px-4 py-2 rounded-md border text-sm ${tab === 'crypto-mpesa' ? 'bg-[#0795B0] text-white border-[#0795B0]' : 'bg-transparent text-white border-[#0795B0] hover:bg-[#0A0E0E]'}`}
          >
            📱 Send Crypto → M-Pesa
          </button>
          <button
            onClick={() => setShowQRScanner(true)}
            className={`px-4 py-2 rounded-md border text-sm ${tab === 'scan' ? 'bg-[#0795B0] text-white border-[#0795B0]' : 'bg-transparent text-white border-[#0795B0] hover:bg-[#0A0E0E]'}`}
          >
            📷 Scan QR Code
          </button>
        </div>
      </article>
      
      <article className="mt-8 flex flex-col items-center p-5 xl:px-[200px]">
        <div className="w-full max-w-4xl">
          {tab === 'merchant' && <PayMerchantForm />}
          {tab === 'bills' && <PayWithCryptoForm />}
          {tab === 'crypto-mpesa' && <CryptoToMpesaForm />}
        </div>
      </article>

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner 
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={() => setShowQRScanner(false)}
        />
      )}
    </section>
  );
}
