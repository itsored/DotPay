"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Assuming these components exist in your project
import { useAuth as useAuthOriginal } from "@/context/AuthContext"; // Import the original useAuth hook

import { Formik, Form } from "formik";
import * as Yup from "yup";
import TextInput from "@/components/inputs/TextInput";
import PasswordInput from "@/components/inputs/PasswordInput";
import {
  AuthContextType,
  OTPFormData,
  SignUpBusinessFormData,
  SignUpFormData,
} from "@/types/form-types";
import useAxios from "@/hooks/useAxios";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import LoadingDialog from "@/components/dialog/LoadingDialog";
import ErrorDialog from "@/components/dialog/ErrorDialog";
import Link from "next/link";
import toast from "react-hot-toast";
import SuccessDialog from "@/components/dialog/SuccessDialog";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { businessV2API } from "@/lib/business-v2";

// A wrapper or assertion to cast the useAuth hook's return type
const useAuth = () => useAuthOriginal() as unknown as AuthContextType;

const SignupBusiness = () => {
  const { login, user, isAuthenticated } = useAuth(); // Get user data for auto-fill
  const [openOTP, setOpenOTP] = useState(false);
  const router = useRouter();
  const [tillNumberParts, setTillNumberParts] = useState("");
  const [openMerchantSuccess, setOpenMerchantSuccess] = useState(false);
  const [openSigningUp, setOpenSigningUp] = useState(false); // Opens the Account Creation Loading Dialog
  const [openConfirmingOTP, setOpenConfirmingOTP] = useState(false); // Opens the confirm otp Loading Dialog
  const [openAccErr, setOpenAccErr] = useState(false); // Opens the Failed Acc Creation Loading Dialog
  const [errorMessage, setErrorMessage] = useState(""); // Store specific error message
  const [existingBusinesses, setExistingBusinesses] = useState<any[]>([]); // Track existing business accounts
  const api = useAxios();
  // Forgot Password Dialog state
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'confirm'>('request');
  const [fpMerchantId, setFpMerchantId] = useState("");
  const [fpPhone, setFpPhone] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const buildAuthHeader = () => {
    try {
      const ctxToken = (user as any)?.token as string | undefined;
      const raw = ctxToken || localStorage.getItem('nexuspay_token') || localStorage.getItem('user') || localStorage.getItem('nexuspay_user');
      if (!raw) return undefined;
      let token = raw as string;
      if (token.startsWith('{')) {
        const parsed = JSON.parse(token as string);
        token = parsed?.data?.token || parsed?.token || parsed?.user?.token || '';
      }
      token = token.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '');
      const header = token ? { Authorization: `Bearer ${token}` } : undefined;
      return header;
    } catch {
      return undefined;
    }
  };
  const [userDetails, setUserDetails] = useState<SignUpBusinessFormData>({
    userId: "",
    ownerName: "",
    businessName: "",
    location: "",
    phoneNumber: "",
    businessType: "",
  });

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: any) => {
    const errorData = error.response?.data;
    const status = error.response?.status;
    
    if (errorData?.message) {
      return errorData.message;
    }
    
    switch (status) {
      case 400:
        return "Invalid data provided. Please check your information and try again.";
      case 401:
        return "Authentication required. Please login first.";
      case 403:
        return "Access denied. You don't have permission to perform this action.";
      case 404:
        return "Service not found. Please contact support.";
      case 409:
        return "Phone number already registered. Please use a different phone number or login with existing account.";
      case 422:
        return "Validation failed. Please check your input and try again.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  // Helper function to check existing businesses for a phone number
  const checkExistingBusinesses = async (phoneNumber: string) => {
    try {
      const formattedPhone = phoneNumber.toString().startsWith('+') 
        ? phoneNumber 
        : `+${phoneNumber}`;
        
      const response = await api.get(`business/phone/${formattedPhone.replace('+', '')}`);
      
      if (response.data?.success && response.data?.data?.businesses) {
        setExistingBusinesses(response.data.data.businesses);
        console.log(`Found ${response.data.data.businesses.length} existing business accounts`);
      }
    } catch (error) {
      console.log("No existing businesses found or error checking:", error);
      setExistingBusinesses([]);
    }
  };

  // Form hook for OTP verification
  const {
    register: registerOTP,
    setValue: setOTPValue,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors },
  } = useForm<OTPFormData>();

  // Mutation to initiate business auth (new endpoint with fallback to legacy)
  const initiateRegisterUser = useMutation({
    mutationFn: async (initiateRegisterUserPost: SignUpBusinessFormData) => {
      setOpenSigningUp(true);

      // Ensure phone number has + prefix for registration
      const formattedPhoneNumber = initiateRegisterUserPost.phoneNumber.toString().startsWith('+')
        ? initiateRegisterUserPost.phoneNumber
        : `+${initiateRegisterUserPost.phoneNumber}`;

      console.log("Requesting business auth OTP (new flow):", {
        phoneNumber: formattedPhoneNumber,
        context: 'business_creation',
      });

      // Save details for OTP verification
      setUserDetails({ ...initiateRegisterUserPost, phoneNumber: formattedPhoneNumber });

      try {
        // New: request OTP via business auth route with explicit Authorization
        const headers = buildAuthHeader();
        console.log('[business] request-otp header present:', !!headers?.Authorization);
        return await axios.post(
          "http://localhost:8000/api/business/auth/request-otp",
          {
            phoneNumber: formattedPhoneNumber,
            context: 'business_creation',
          },
          { headers }
        );
      } catch (error: any) {
        const routeNotFound =
          error?.response?.status === 404 ||
          error?.response?.data?.error?.code === 'ROUTE_NOT_FOUND' ||
          /Route .*request-otp not found/i.test(error?.response?.data?.message || '');
        if (routeNotFound) {
          console.warn('business/auth/request-otp not found. Falling back to legacy request-upgrade.');
          const headers = buildAuthHeader();
          return await axios.post(
            "http://localhost:8000/api/business/request-upgrade",
            {
              userId: initiateRegisterUserPost.userId || 'temp_user_id',
              phoneNumber: formattedPhoneNumber,
              businessName: initiateRegisterUserPost.businessName,
              ownerName: initiateRegisterUserPost.ownerName,
              location: initiateRegisterUserPost.location,
              businessType: initiateRegisterUserPost.businessType || 'General Business',
            },
            { headers }
          );
        }
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      console.log("Business auth/request-otp success or legacy request-upgrade success:", data);
      setOpenSigningUp(false);

      // Prompt for OTP (server logs/ sends it)
      setOpenOTP(true);
    },
    onError: (error: any) => {
      console.error("Failed to request business auth OTP:", error);
      console.error("Error response:", error.response?.data);
      setOpenSigningUp(false);

      const specificMessage = getErrorMessage(error);
      setErrorMessage(specificMessage);
      setOpenAccErr(true);
    },
    onSettled: () => {
      setOpenSigningUp(false);
    },
  });

  // Mutation Side Effect to Login User
  const loginUser = useMutation({
    mutationFn: (loginUserPost: SignUpBusinessFormData) => {
      // Ensure phone number has + prefix for login
      const formattedPhoneNumber = loginUserPost.phoneNumber.toString().startsWith('+') 
        ? loginUserPost.phoneNumber 
        : `+${loginUserPost.phoneNumber}`;
        
      console.log("Attempting login with:", {
        phoneNumber: formattedPhoneNumber,
      });
      
      // For business accounts, we don't need password login
      // This is just a fallback, but business creation should handle authentication
      return Promise.resolve({ success: true, data: { token: "business_token" } });
    },
    onSuccess: (data, variables, context) => {
      console.log("Login success:", data);
      login(data); // Use the login function from your context
      setOpenSigningUp(false); //
      setOpenMerchantSuccess(true);
      setTimeout(() => {
        router.replace("/home"); // Successfully logged in, navigate to home or dashboard
      }, 2000);
    },
    onError: (error: any, variables, context) => {
      console.error("Login failed:", error);
      console.error("Login error response:", error.response?.data);
      setOpenAccErr(true);
    },
    onSettled: (data, error, variables, context) => {
      console.log("Login settled:", { data, error });
    },
  });

  // Verify OTP using new endpoint; if missing, fall back to legacy complete-upgrade
  const verifyUser = useMutation({
    mutationFn: async () => {
      // Ensure phone number has + prefix for verification
      const formattedPhoneNumber = userDetails.phoneNumber.toString().startsWith('+')
        ? userDetails.phoneNumber
        : `+${userDetails.phoneNumber}`;

      console.log("Verifying business auth OTP:", { phoneNumber: formattedPhoneNumber, context: 'business_creation' });

      try {
        // New: verify OTP to elevate session with explicit Authorization
        const headers = buildAuthHeader();
        console.log('[business] verify-otp header present:', !!headers?.Authorization);
        await axios.post(
          "http://localhost:8000/api/business/auth/verify-otp",
          {
            phoneNumber: formattedPhoneNumber,
            otp: tillNumberParts,
            context: 'business_creation',
          },
          { headers }
        );

        // Then perform the strict action
        const upgradeResponse = await axios.post(
          "http://localhost:8000/api/business/request-upgrade",
          {
            userId: userDetails.userId || 'temp_user_id',
            phoneNumber: formattedPhoneNumber,
            businessName: userDetails.businessName,
            ownerName: userDetails.ownerName,
            location: userDetails.location,
            businessType: userDetails.businessType || 'General Business',
          },
          { headers }
        );
        return upgradeResponse;
      } catch (error: any) {
        const routeNotFound =
          error?.response?.status === 404 ||
          error?.response?.data?.error?.code === 'ROUTE_NOT_FOUND' ||
          /Route .*verify-otp not found/i.test(error?.response?.data?.message || '');
        if (routeNotFound) {
          console.warn('business/auth/verify-otp not found. Falling back to legacy complete-upgrade.');
          const headers = buildAuthHeader();
          const legacyResponse = await axios.post(
            "http://localhost:8000/api/business/complete-upgrade",
            {
              userId: userDetails.userId || 'temp_user_id',
              phoneNumber: formattedPhoneNumber,
              otp: tillNumberParts,
              businessName: userDetails.businessName,
              ownerName: userDetails.ownerName,
              location: userDetails.location,
              businessType: userDetails.businessType || 'General Business',
            },
            { headers }
          );
          return legacyResponse;
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Business creation success:", data);
      setOpenConfirmingOTP(false);

      // Optionally show details from response if present
      if (data.data?.merchantId) {
        console.log("✅ Business Account Created Successfully!");
        console.log("Merchant ID:", data.data.merchantId);
      }

      setOpenMerchantSuccess(true);
      setTimeout(() => {
        router.replace("/business");
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Failed to verify OTP or create business:", error);
      console.error("Error response:", error.response?.data);

      const specificMessage = getErrorMessage(error);
      setErrorMessage(specificMessage);
      setOpenAccErr(true);
    },
    onSettled: (data, error) => {
      console.log("OTP verification and creation settled:", { data, error });
    },
  });

  // Forgot Password Mutations (Business Owner)
  const forgotRequestMutation = useMutation({
    mutationFn: async () => {
      return businessV2API.passwordResetRequest({
        merchantId: fpMerchantId || undefined,
        phoneNumber: fpPhone || undefined,
      });
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'OTP sent');
      setForgotStep('confirm');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    }
  });

  const forgotConfirmMutation = useMutation({
    mutationFn: async () => {
      return businessV2API.passwordResetConfirm({
        merchantId: fpMerchantId || undefined,
        phoneNumber: fpPhone || undefined,
        otp: fpOtp,
        newPassword: fpNewPassword,
      });
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Password reset successful');
      setShowForgotPwd(false);
      setForgotStep('request');
      setFpMerchantId(""); setFpPhone(""); setFpOtp(""); setFpNewPassword("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    }
  });

  const verifyOTP = async (otpData: OTPFormData) => {
    if (!userDetails) {
      console.error("No user details available");
      return;
    }
    
    if (!tillNumberParts || tillNumberParts.length !== 6) {
      console.error("Invalid OTP length:", tillNumberParts);
      return;
    }
    
    // Clear any previous error messages
    setErrorMessage("");
    
    // Ensure phone number has + prefix
    const formattedPhoneNumber = userDetails.phoneNumber.toString().startsWith('+') 
      ? userDetails.phoneNumber 
      : `+${userDetails.phoneNumber}`;
    
    console.log("Starting business creation with:", {
      phoneNumber: formattedPhoneNumber,
      otp: tillNumberParts,
    });

    // Call the verify API with stored user details and provided OTP
    verifyUser.mutate();
  };

  return (
    <>
    <section className="app-background min-h-screen bg-[#0A0E0E]">
      <Dialog open={openOTP} onOpenChange={setOpenOTP}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">
              Enter Business Verification Code from SMS
            </DialogTitle>
            <hr className="my-4" />
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Business OTP:</strong> Check your SMS for the 6-digit business verification code
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                ⚠️ <strong>Note:</strong> This OTP is specifically for business account creation
              </p>
            </div>
            <form
              onSubmit={handleOTPSubmit(verifyOTP)}
              className="flex flex-col justify-around h-[200px]"
            >
              <div className="flex justify-center space-x-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={tillNumberParts[index] || ""}
                    onChange={(e) => {
                      const newOtp = tillNumberParts.split("");
                      newOtp[index] = e.target.value;
                      setTillNumberParts(newOtp.join(""));
                      
                      // Auto-focus next input
                      if (e.target.value && index < 5 && typeof document !== 'undefined') {
                        const nextInput = document.querySelector(`input[data-business-index="${index + 1}"]`) as HTMLInputElement;
                        if (nextInput) nextInput.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace to focus previous input
                      if (e.key === "Backspace" && !tillNumberParts[index] && index > 0 && typeof document !== 'undefined') {
                        const prevInput = document.querySelector(`input[data-business-index="${index - 1}"]`) as HTMLInputElement;
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    data-business-index={index}
                    className="w-10 h-10 text-center text-lg font-semibold border border-black rounded-lg focus:border-[#0795B0] focus:outline-none bg-white text-black"
                  />
                ))}
              </div>
              <button
                type="submit"
                className="bg-black text-white font-semibold rounded-lg p-3 w-auto"
              >
                Create Business Account
              </button>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <LoadingDialog
        message="Requesting Business Account Creation"
        openLoading={openSigningUp}
        setOpenLoading={setOpenSigningUp}
      />
      <LoadingDialog
        message="Verifying OTP and creating business..."
        openLoading={openConfirmingOTP}
        setOpenLoading={setOpenConfirmingOTP}
      />
      <SuccessDialog
        message="Business Account Created Successfully! You can now manage multiple business accounts under one personal wallet."
        openSuccess={openMerchantSuccess}
        setOpenSuccess={setOpenMerchantSuccess}
      />
      <ErrorDialog
        message={errorMessage || "Failed to Create Business Account"}
        openError={openAccErr}
        setOpenError={setOpenAccErr}
      />
      <article>
        <h2 className="text-4xl text-white font-bold">
          Sign Up to NexusPay For Business
        </h2>
        <h4 className="text-white my-5">
          Enter your Details to Sign Up to NexusPay
        </h4>
        
        {/* SignUp using Formik */}
        <Formik
          initialValues={{
            userId: user?.id || "",
            ownerName: "",
            businessName: "",
            location: "",
            phoneNumber: user?.phoneNumber || "",
            businessType: "",
          }}
          validationSchema={Yup.object({
            userId: Yup.string()
              .min(3, "Min of 3 Characters required")
              .required("User ID is Required"),
            ownerName: Yup.string()
              .min(6, "Min of 6 Characters required")
              .required("Business Owner Name is Required"),
            businessName: Yup.string()
              .min(5, "Min of 5 Characters required")
              .required("Business Name is Required"),
            location: Yup.string()
              .min(4, "Min of 4 Characters required")
              .required("Location is Required"),
            phoneNumber: Yup.number()
              .min(13, "Min of 13 Characters required")
              .required("Phone Number is Required"),
            businessType: Yup.string()
              .min(3, "Min of 3 Characters required")
              .required("Business Type is Required"),
          })}
          onSubmit={(values, { setSubmitting }) => {
            setTimeout(async () => {
              // Clear any previous error messages
              setErrorMessage("");
              setOpenSigningUp(true);
              
              // Check if phoneNumber starts with '01' or '07' and modify it
              let modifiedPhoneNumber = values.phoneNumber;
              if (
                modifiedPhoneNumber.toString().startsWith("1") ||
                modifiedPhoneNumber.toString().startsWith("7")
              ) {
                modifiedPhoneNumber =
                  "+254" + values.phoneNumber.toString().substring(0);
              }

              // Use the modifiedPhoneNumber in your API request
              const requestData = {
                ...values,
                phoneNumber: modifiedPhoneNumber, // Replace the original phoneNumber with the modified one
              };

              // Call the Initiate Register User Mutation
              // console.log(requestData);
              initiateRegisterUser.mutate(requestData);
              setOpenSigningUp(false);
              setSubmitting(false);
            }, 400);
          }}
        >
          <Form>
            <TextInput
              label="User ID"
              name="userId"
              type="text"
              placeholder="Enter your User ID from personal account"
            />
            <TextInput
              label="Business Name"
              name="businessName"
              type="text"
              placeholder="Enter your Business Name"
            />
            <TextInput
              label="Business Owner Name"
              name="ownerName"
              type="text"
              placeholder="Enter your Business Owner Name"
            />
            <TextInput
              label="Location"
              name="location"
              type="text"
              placeholder="Enter your Location"
            />
            <TextInput
              label="Phone Number"
              name="phoneNumber"
              type="number"
              placeholder="Enter your Phone Number eg (0720****20)"
            />
            <TextInput
              label="Business Type"
              name="businessType"
              type="text"
              placeholder="e.g., Technology Services, Retail, etc."
            />
            <div className="flex flex-col justify-start mb-5">
              <p className="text-[#909090] p-1 text-sm font-semibold">
                Have an account?{" "}
                <Link href="/login" className="hover:text-white">
                  Login
                </Link>
              </p>
              <p className="text-[#909090] p-1 text-sm font-semibold">
                <Link href="/signup" className="hover:text-white">
                  Create a Personal Account?
                </Link>
              </p>
            </div>
            <button
              type="submit"
              className="bg-white mt-5 p-3 rounded-full font-bold w-full cursor-pointer"
            >
              Create Business
            </button>

          </Form>
        </Formik>

      </article>
    </section>

    {/* Business Forgot Password Dialog */}
    <Dialog open={showForgotPwd} onOpenChange={setShowForgotPwd}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-black text-xl font-bold">
            {forgotStep === 'request' ? 'Reset Business Owner Password' : 'Confirm New Password'}
          </DialogTitle>
        </DialogHeader>
        {forgotStep === 'request' ? (
          <div className="space-y-3">
            <p className="text-gray-700 text-sm">Enter either your Merchant ID or Business Phone Number.</p>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Merchant ID</label>
              <input
                value={fpMerchantId}
                onChange={(e) => setFpMerchantId(e.target.value)}
                placeholder="NX-582917"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="text-center text-xs text-gray-500">or</div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Business Phone (+E.164)</label>
              <input
                value={fpPhone}
                onChange={(e) => setFpPhone(e.target.value)}
                placeholder="+2547xxxxxxx"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={() => forgotRequestMutation.mutate()}
              disabled={forgotRequestMutation.isPending || (!fpMerchantId && !fpPhone)}
              className="w-full bg-black text-white rounded py-2 mt-2 disabled:opacity-50"
            >
              {forgotRequestMutation.isPending ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-700 text-sm">Enter the OTP sent and your new password.</p>
            <div>
              <label className="block text-sm text-gray-700 mb-1">OTP</label>
              <input
                value={fpOtp}
                onChange={(e) => setFpOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={fpNewPassword}
                onChange={(e) => setFpNewPassword(e.target.value)}
                placeholder="StrongPass#2025"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={() => forgotConfirmMutation.mutate()}
              disabled={forgotConfirmMutation.isPending || !fpOtp || !fpNewPassword}
              className="w-full bg-black text-white rounded py-2 mt-2 disabled:opacity-50"
            >
              {forgotConfirmMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default SignupBusiness;
