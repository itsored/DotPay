"use client";

import React, { useState } from 'react';
import { BusinessList } from '@/components/business/BusinessList';
import { BusinessPinLogin } from '@/components/business/BusinessPinLogin';
import { ArrowLeft } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BusinessPage() {
  const router = useRouter();
  const [showPinLogin, setShowPinLogin] = useState(false);

  const handleBackToHome = () => {
    router.push('/home');
  };

  const handlePinLoginSuccess = () => {
    setShowPinLogin(false);
    // BusinessPinLogin now handles redirect to business homepage
  };

  return (
    <section className="home-background min-h-screen">
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
        
        <div className="text-center mb-8">
          <h1 className="text-4xl text-white font-bold mb-3">Business Accounts</h1>
          <p className="text-gray-400 text-lg">Manage and switch between your business accounts</p>
          
          {/* Toggle Button */}
          <div className="flex justify-center gap-4 mt-6">
            <Button
              onClick={() => setShowPinLogin(false)}
              variant={!showPinLogin ? "default" : "outline"}
              className={!showPinLogin ? "bg-[#0795B0] text-white" : "border-[#0795B0] text-[#0795B0]"}
            >
              Browse Accounts
            </Button>
            <Button
              onClick={() => setShowPinLogin(true)}
              variant={showPinLogin ? "default" : "outline"}
              className={showPinLogin ? "bg-[#0795B0] text-white" : "border-[#0795B0] text-[#0795B0]"}
            >
              PIN Login
            </Button>
          </div>
        </div>
      </article>
      
      <article className="bg-[#0A0E0E] flex flex-col items-center p-5 xl:px-[200px] min-h-screen">
        <div className="w-full max-w-4xl">
          {showPinLogin ? (
            <BusinessPinLogin 
              onSuccess={handlePinLoginSuccess}
            />
          ) : (
            <BusinessList 
              showCreateButton={true}
            />
          )}
        </div>
      </article>
    </section>
  );
}
