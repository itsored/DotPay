"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "@/lib/auth";
import { useWallet } from "../../context/WalletContext";
import { useChain } from "../../context/ChainContext";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Smartphone, Mail, Link, Unlink, ArrowLeft, CheckCircle, AlertCircle, Copy, Eye, EyeOff, User, Settings as SettingsIcon } from "lucide-react";
import toast from "react-hot-toast";
import AuthGuard from "../../components/auth/AuthGuard";
import { useMutation } from "@tanstack/react-query";
import useAxios from "../../hooks/useAxios";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import TextInput from "../../components/inputs/TextInput";
import PasswordInput from "../../components/inputs/PasswordInput";
import { formatPhoneNumberToE164, validateE164PhoneNumber } from "../../lib/phone-utils";
import { BusinessSettings } from "../../components/business/BusinessSettings";

const SettingsPage = () => {
  const { user, isAuthenticated, getGoogleConfig } = useAuth();
  const { wallet, hasWallet, loading, initializeWallet } = useWallet();
  const { chain } = useChain();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUserId, setShowUserId] = useState(false);
  const [copied, setCopied] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [showPhoneLinkDialog, setShowPhoneLinkDialog] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(false);
  const api = useAxios();

  // Mutation to link Google account
  const linkGoogleMutation = useMutation({
    mutationFn: async (idToken: string) => {
      return api.post("auth/google/link", {
        idToken: idToken
      });
    },
    onSuccess: (data) => {
      console.log('Google linking success response:', data);
      toast.success("Google account linked successfully!");
      setShowGoogleSignIn(false);
      
      // Update userProfile with Google account info
      if (data?.data?.user) {
        console.log('Updating userProfile with Google data:', data.data.user);
        setUserProfile((prev: any) => ({
          ...prev,
          googleId: data.data.user.googleId || data.data.user.email,
          email: data.data.user.email,
          authMethods: data.data.user.authMethods || ['google']
        }));
      }
      
      loadUserProfile(); // Refresh user profile
    },
    onError: (error: any) => {
      console.error("Failed to link Google account:", error);
      if (error?.response?.status === 409) {
        toast.error("This Google account is already linked to another user");
      } else {
        toast.error("Failed to link Google account. Please try again.");
      }
    }
  });

  // Mutation to add phone and password
  const addPhonePasswordMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; password: string }) => {
      return api.post("auth/settings/add-phone-password", {
        phoneNumber: data.phoneNumber,
        password: data.password
      });
    },
    onSuccess: (data, variables) => {
      toast.success("OTP sent to your phone number");
      setPendingPhoneNumber(variables.phoneNumber);
      setPendingPassword(variables.password);
      setShowPhoneLinkDialog(false);
      setShowOTPDialog(true);
    },
    onError: (error: any) => {
      console.error("Failed to add phone and password:", error);
      if (error?.response?.status === 409) {
        const msg = error?.response?.data?.message || 'Phone already linked or credentials conflict';
        toast.error(msg);
      } else if (error?.response?.status === 400) {
        toast.error(error?.response?.data?.message || 'Invalid request');
      } else {
        toast.error("Failed to add phone and password. Please try again.");
      }
    }
  });

  // Mutation to verify phone and password setup
  const verifyPhonePasswordMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; otp: string }) => {
      return api.post("auth/settings/verify-phone-password", {
        phoneNumber: data.phoneNumber,
        otp: data.otp
      });
    },
    onSuccess: (data) => {
      toast.success("Phone and password added successfully!");
      setShowOTPDialog(false);
      loadUserProfile(); // Refresh user profile
    },
    onError: (error: any) => {
      console.error("Failed to verify phone and password:", error);
      toast.error("Invalid OTP. Please try again.");
    }
  });

  // Load user profile on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
    }
  }, [isAuthenticated, user]);

  // Initialize Google Sign-In when component mounts with server/env client ID
  useEffect(() => {
    const initGsi = async () => {
      try {
        if (typeof window === 'undefined') return;
        if (!window.google) return;

        // Prefer server config; fallback to env
        let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
        try {
          const config = await getGoogleConfig();
          const serverClientId = (config as any)?.data?.clientId || (config as any)?.clientId;
          if (serverClientId) clientId = serverClientId;
        } catch {
          // ignore, fallback to env
        }

        if (!clientId) {
          console.error('Missing Google client_id for settings GSI init');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              linkGoogleMutation.mutate(response.credential);
            } else {
              toast.error("Failed to get Google credentials");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });
      } catch (e) {
        console.error('Failed to initialize GSI on settings page', e);
      }
    };
    initGsi();
  }, []);

  const loadUserProfile = async () => {
    try {
      setProfileLoading(true);
      // Fetch stable user id from backend
      let stableId = user?.id || '';
      try {
        const me = await authAPI.getMe();
        stableId = (me as any)?.data?.user?.id || stableId;
      } catch (e) {
        // fallback to existing
      }

      setUserProfile({
        id: stableId || user?.id || `user_${Date.now()}`,
        email: user?.email,
        phoneNumber: user?.phoneNumber,
        googleId: user?.googleId || user?.email,
        authMethods: [
          ...(user?.phoneNumber ? ['phone'] : []),
          ...(user?.email ? ['google'] : [])
        ]
      });
      toast.success("Profile loaded successfully");
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile - using cached data");
      // Fallback to user data
      setUserProfile({
        id: user?.id || `user_${Date.now()}`,
        email: user?.email,
        phoneNumber: user?.phoneNumber,
        googleId: user?.googleId || user?.email, // Use email as googleId if no specific googleId
        authMethods: [
          ...(user?.phoneNumber ? ['phone'] : []),
          ...(user?.email ? ['google'] : [])
        ]
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const copyUserId = async () => {
    const userId = userProfile?.id || user?.id;
    if (userId) {
      try {
        await navigator.clipboard.writeText(userId);
        setCopied(true);
        toast.success("User ID copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy user ID:', error);
        toast.error("Failed to copy user ID");
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    if (text && text !== "Not set") {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  // Wallet helpers (match Receive page behavior)
  const universalWalletAddress = wallet?.walletAddress || wallet?.address || user?.walletAddress || "";
  const phoneNumber = wallet?.phoneNumber || user?.phoneNumber || "";
  const email = wallet?.email || user?.email || "";
  const supportedChains = wallet?.supportedChains || [];

  const handleInitializeWallet = async () => {
    try {
      setInitializing(true);
      await initializeWallet();
      toast.success('Wallet set up successfully!');
    } catch (error) {
      // handled in context
    } finally {
      setInitializing(false);
    }
  };

  const formatWalletAddress = (address: string) => {
    return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'No wallet address';
  };

  const handleLinkGoogle = async () => {
    try {
      setShowGoogleSignIn(true);
      
      // Check if Google Sign-In is available
      if (typeof window !== 'undefined' && window.google) {
        // Render the sign-in button after a short delay to ensure DOM is ready
        setTimeout(() => {
          const buttonDiv = document.getElementById('google-signin-button-settings');
          if (buttonDiv) {
            buttonDiv.innerHTML = ''; // Clear any existing content
            window.google.accounts.id.renderButton(buttonDiv, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              width: 200
            });
          }
        }, 100);
      } else {
        toast.error("Google Sign-In is not available. Please refresh the page and try again.");
        setShowGoogleSignIn(false);
      }
    } catch (error) {
      console.error("Failed to link Google:", error);
      toast.error("Failed to link Google account");
      setShowGoogleSignIn(false);
    }
  };

  const handleLinkPhone = async () => {
    try {
      setProfileLoading(true);
      setShowPhoneLinkDialog(true);
    } catch (error) {
      console.error("Failed to link phone:", error);
      toast.error("Failed to link phone number");
    } finally {
      setProfileLoading(false);
    }
  };

  const getAuthMethodStatus = (method: string) => {
    if (!userProfile) return { linked: false, icon: <AlertCircle className="h-4 w-4 text-gray-400" /> };
    
    let linked = false;
    
    if (method === 'phone') {
      linked = userProfile.authMethods?.includes('phone') || 
               userProfile.phoneNumber || 
               user?.phoneNumber;
    } else if (method === 'google') {
      linked = userProfile.authMethods?.includes('google') || 
               userProfile.googleId || 
               user?.googleId ||
               user?.email; // If user has email, they might have Google linked
    }
    
    return {
      linked,
      icon: linked ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-gray-400" />
    };
  };

  return (
    <AuthGuard>
      <section className="home-background min-h-screen">
        {/* Top bar to match app theme */}
        <article className="bg-[#0A0E0E] flex flex-col p-5 xl:px-[200px] border-0 border-b border-[#0795B0]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/home")}
              className="flex items-center text-white hover:text-[#0795B0] transition-colors duration-200 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-lg font-medium">Back to Home</span>
            </button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <span />
          </div>
        </article>

        {/* Main content */}
        <article className="mt-8 flex flex-col items-center p-4 sm:p-5 xl:px-[200px]">
          <div className="w-full max-w-4xl space-y-6">
            {/* Account Information */}
            <div className="bg-[#0A0E0E] rounded-xl border border-[#0795B0] p-4 sm:p-6 text-white">
              <div className="mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" /> Account Information
                </h2>
                <p className="text-gray-400 text-sm">Your basic account details and User ID</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#A4A4A4]">Email</label>
                  <p className="font-mono">{email || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm text-[#A4A4A4]">Phone Number</label>
                  <p className="font-mono">{phoneNumber || "Not set"}</p>
                </div>
              </div>

              <div className="border-t border-[#0795B0]/50 pt-4 mt-4">
                <label className="text-sm text-[#A4A4A4] mb-2 block">User ID</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/40 rounded-lg p-3 font-mono text-sm">
                    {showUserId ? (
                      <span>{userProfile?.id || user?.id || "Loading..."}</span>
                    ) : (
                      <span className="text-gray-400">••••••••••••••••</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUserId(!showUserId)}
                    className="border-[#0795B0] text-white bg-transparent hover:bg-[#0795B0]/20 hover:text-white"
                  >
                    {showUserId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyUserId}
                    className="border-[#0795B0] text-white bg-transparent hover:bg-[#0795B0]/20 hover:text-white"
                    disabled={!userProfile?.id && !user?.id}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copied && (
                  <p className="text-green-400 text-xs mt-1">Copied to clipboard!</p>
                )}
                <p className="text-[#A4A4A4] text-xs mt-2">
                  This User ID is required for creating business accounts
                </p>
              </div>
            </div>

            {/* Wallet Information (Universal and per-chain) */}
            <div className="bg-[#0A0E0E] rounded-xl border border-[#0795B0] p-4 sm:p-6 text-white">
              <div className="mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-500 rounded-full" /> Wallet Information
                </h2>
                <p className="text-gray-400 text-sm">Your universal wallet and chain addresses</p>
              </div>

              {/* Universal wallet */}
              <div className="flex flex-col mb-4">
                <label className="text-sm text-[#A4A4A4]">Universal Wallet Address</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between sm:items-center border border-[#0795B0] rounded-lg p-3 bg-[#0A0E0E]">
                  <span className="flex-1 sm:mr-2 text-sm break-all">{universalWalletAddress ? formatWalletAddress(universalWalletAddress) : 'Not available'}</span>
                  {universalWalletAddress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(universalWalletAddress)}
                      className="border-[#0795B0] text-white bg-transparent hover:bg-[#0795B0]/20 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!universalWalletAddress && (
                  <div className="mt-3">
                    <Button
                      onClick={handleInitializeWallet}
                      disabled={initializing || loading || hasWallet}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {initializing ? 'Setting up...' : 'Set Up Wallet'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Per-chain display from user fallback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#A4A4A4]">Arbitrum Wallet</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-black/40 rounded-lg p-3 font-mono text-sm break-all">
                      <span>{user?.arbitrumWallet || user?.walletAddress || "Not set"}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(user?.arbitrumWallet || user?.walletAddress || "")}
                      className="border-[#0795B0] text-white bg-transparent hover:bg-[#0795B0]/20 hover:text-white disabled:opacity-50"
                      disabled={!user?.arbitrumWallet && !user?.walletAddress}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#A4A4A4]">Celo Wallet</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-black/40 rounded-lg p-3 font-mono text-sm break-all">
                      <span>{user?.celoWallet || user?.walletAddress || "Not set"}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(user?.celoWallet || user?.walletAddress || "")}
                      className="border-[#0795B0] text-white bg-transparent hover:bg-[#0795B0]/20 hover:text-white disabled:opacity-50"
                      disabled={!user?.celoWallet && !user?.walletAddress}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Supported Chains */}
              {supportedChains.length > 0 && (
                <div className="mt-6 p-4 bg-black/40 border border-[#0795B0]/40 rounded-lg">
                  <h4 className="font-semibold mb-3">Supported Networks:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {supportedChains.map((chain: any) => (
                      <div key={chain.id} className="flex items-center space-x-2 p-2 bg-black/40 rounded">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">{chain.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Authentication Methods */}
            <div className="bg-[#0A0E0E] rounded-xl border border-[#0795B0] p-4 sm:p-6 text-white">
              <div className="mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" /> Authentication Methods
                </h2>
                <p className="text-gray-400 text-sm">Link your phone number and Google account for secure access</p>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-black/40 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="font-medium">Phone Number</h3>
                    <p className="text-gray-400 text-sm">{phoneNumber || "No phone number linked"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getAuthMethodStatus('phone').icon}
                  <Button
                    onClick={handleLinkPhone}
                    disabled={loading || addPhonePasswordMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="border-[#0795B0] text-white bg-transparent hover:bg-[#0795B0]/20 hover:text-white disabled:opacity-50 w-full sm:w-auto"
                  >
                    {user?.phoneNumber ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                    {user?.phoneNumber ? "Unlink" : "Add Phone"}
                  </Button>
                </div>
              </div>

              {/* Google Account */}
              <div className="p-4 bg-black/40 rounded-lg mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-red-400" />
                    <div>
                      <h3 className="font-medium">Google Account</h3>
                      <p className="text-gray-400 text-sm">
                        {getAuthMethodStatus('google').linked 
                          ? `Google account linked (${userProfile?.email || user?.email || 'Google account'})` 
                          : "No Google account linked"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAuthMethodStatus('google').icon}
                    {!showGoogleSignIn && (
                      <Button
                        onClick={handleLinkGoogle}
                        disabled={loading || linkGoogleMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="border-[#0795B0] text-white bg-transparent hover:bg-[#0795B0]/20 hover:text-white disabled:opacity-50 w-full sm:w-auto"
                      >
                        {getAuthMethodStatus('google').linked ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                        {getAuthMethodStatus('google').linked ? "Unlink" : "Link Google"}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Google Sign-In Button */}
                {showGoogleSignIn && (
                  <div className="mt-3 p-3 bg-white/10 rounded-lg">
                    <p className="text-white text-sm mb-3">Click the button below to link your Google account:</p>
                    <div id="google-signin-button-settings" className="flex justify-center"></div>
                    <Button
                      onClick={() => setShowGoogleSignIn(false)}
                      variant="outline"
                      size="sm"
                      className="mt-3 border-gray-500 text-gray-300 bg-transparent hover:bg-gray-500/20 hover:text-white w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-[#0A0E0E] rounded-xl border border-[#0795B0] p-4 sm:p-6 text-white">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Security</h2>
                <p className="text-gray-400 text-sm">Manage your security preferences</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg mt-3">
                <div>
                  <h3 className="font-medium">Password Change</h3>
                  <p className="text-gray-400 text-sm">Update your account password</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={loadUserProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Refresh Profile
              </Button>
              <Button
                onClick={() => router.push("/signup/business")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Create Business Account
              </Button>
            </div>

            {/* Business Settings */}
            <BusinessSettings />
          </div>
        </article>

        {/* Phone Linking Dialog */}
        <Dialog open={showPhoneLinkDialog} onOpenChange={setShowPhoneLinkDialog}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black mb-2">
                Add Phone Number & Password
              </DialogTitle>
              <DialogDescription className="text-gray-600 mb-4">
                Add a phone number and password to your account for alternative login methods
              </DialogDescription>
            </DialogHeader>
            
            <Formik
              initialValues={{
                phoneNumber: "",
                password: "",
                confirmPassword: "",
              }}
              validationSchema={Yup.object({
                phoneNumber: Yup.string()
                  .required("Phone Number is Required"),
                password: Yup.string()
                  .min(5, "Password must be at least 5 characters")
                  .max(20, "Password must be 20 characters or less")
                  .required("Password is Required"),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('password')], 'Passwords must match')
                  .required("Confirm Password is Required"),
              })}
              onSubmit={(values, { setSubmitting }) => {
                // Format phone number to E.164 format
                const formattedPhoneNumber = formatPhoneNumberToE164(values.phoneNumber);
                
                // Validate the formatted phone number
                if (!validateE164PhoneNumber(formattedPhoneNumber)) {
                  toast.error("Invalid phone number format");
                  setSubmitting(false);
                  return;
                }

                addPhonePasswordMutation.mutate({
                  phoneNumber: formattedPhoneNumber,
                  password: values.password
                });
                setSubmitting(false);
              }}
            >
              <Form>
                <TextInput
                  label="Phone Number"
                  name="phoneNumber"
                  type="text"
                  placeholder="Enter your phone number (e.g., 0720123456)"
                />
                
                <PasswordInput
                  label="Password"
                  name="password"
                  placeholder="Enter your password"
                />
                
                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                />

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPhoneLinkDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addPhonePasswordMutation.isPending}
                    className="flex-1 bg-[#0795B0] hover:bg-[#0684A0] text-white"
                  >
                    {addPhonePasswordMutation.isPending ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              </Form>
            </Formik>
          </DialogContent>
        </Dialog>

        {/* OTP Verification Dialog */}
        <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black mb-2">
                Verify Phone Number
              </DialogTitle>
              <DialogDescription className="text-gray-600 mb-4">
                Enter the OTP code sent to {pendingPhoneNumber}
              </DialogDescription>
            </DialogHeader>
            
            <Formik
              initialValues={{
                otp: "",
              }}
              validationSchema={Yup.object({
                otp: Yup.string()
                  .min(6, "OTP must be 6 digits")
                  .max(6, "OTP must be 6 digits")
                  .required("OTP is Required"),
              })}
              onSubmit={(values, { setSubmitting }) => {
                verifyPhonePasswordMutation.mutate({
                  phoneNumber: pendingPhoneNumber,
                  otp: values.otp
                });
                setSubmitting(false);
              }}
            >
              <Form>
                <TextInput
                  label="OTP Code"
                  name="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                />

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowOTPDialog(false);
                      setShowPhoneLinkDialog(true);
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifyPhonePasswordMutation.isPending}
                    className="flex-1 bg-[#0795B0] hover:bg-[#0684A0] text-white"
                  >
                    {verifyPhonePasswordMutation.isPending ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </Form>
            </Formik>
          </DialogContent>
        </Dialog>
      </section>
    </AuthGuard>
  );
};

export default SettingsPage;
