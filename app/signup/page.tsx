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
  SignUpFormData,
} from "@/types/form-types";
import useAxios from "@/hooks/useAxios";
import { useMutation } from "@tanstack/react-query";
import LoadingDialog from "@/components/dialog/LoadingDialog";
import ErrorDialog from "@/components/dialog/ErrorDialog";
import Link from "next/link";
import toast from "react-hot-toast";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { formatPhoneNumberToE164, validateE164PhoneNumber } from "@/lib/phone-utils";

// A wrapper or assertion to cast the useAuth hook's return type
const useAuth = () => useAuthOriginal() as unknown as AuthContextType;

const Signup = () => {
  const { login } = useAuth(); // Use the typed useAuth hook here
  const [openOTP, setOpenOTP] = useState(false);
  const router = useRouter();
  const [tillNumberParts, setTillNumberParts] = useState("");
  const [openSigningUp, setOpenSigningUp] = useState(false); // Opens the Account Creation Loading Dialog
  const [openConfirmingOTP, setOpenConfirmingOTP] = useState(false); // Opens the confirm otp Loading Dialog
  const [openAccErr, setOpenAccErr] = useState(false); // Opens the Failed Acc Creation Loading Dialog
  const [errorMessage, setErrorMessage] = useState("Failed to Create Account"); // Error message to display
  const api = useAxios();
  const [userDetails, setUserDetails] = useState<SignUpFormData>({
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  // Form hook for OTP verification
  const {
    register: registerOTP,
    setValue: setOTPValue,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors },
  } = useForm<OTPFormData>();

  // Mutation to Initiate Register User
  const initiateRegisterUser = useMutation({
    mutationFn: (initiateRegisterUserPost: SignUpFormData) => {
      setOpenConfirmingOTP(true);
      return api.post(
        "auth/register/initiate",
        {
          phoneNumber: initiateRegisterUserPost.phoneNumber,
          password: initiateRegisterUserPost.password,
        },
        {
          method: "POST",
        }
      );
    },
    onSuccess: (data, variables, context) => {
      setOpenSigningUp(false);
      setUserDetails(variables); // Store user details with the modified phone number
      setOpenOTP(true); // Open the OTP dialog
    },
    onError: (error: any, variables, context) => {
      // Handle errors, e.g., show a message to the user
      console.error("Failed to initiate sign-up:", error);
      
      // Check for specific error types
      if (error?.response?.status === 409) {
        console.error("Phone number already exists. Please use a different phone number or try logging in.");
        setErrorMessage("This phone number is already registered. Please use a different number or try logging in.");
      } else {
        setErrorMessage("Failed to Create Account");
      }
      
      setOpenAccErr(true);
    },
    onSettled: (data, error, variables, context) => {
      setOpenConfirmingOTP(false);
    },
  });

  // Mutation Side Effect to Login User
  const loginUser = useMutation({
    mutationFn: (loginUserPost: SignUpFormData) => {
      return api.post(
        "auth/login",
        {
          phoneNumber: loginUserPost.phoneNumber,
          password: loginUserPost.password,
        },
        {
          method: "POST",
        }
      );
    },
    onSuccess: (data, variables, context) => {
      login(data); // Use the login function from your context
      setOpenSigningUp(false); //
      router.replace("/home"); // Successfully logged in, navigate to home or dashboard
    },
    onError: (error, variables, context) => {
      setOpenAccErr(true);
    },
    onSettled: (data, error, variables, context) => {},
  });

  const verifyUser = useMutation({
    mutationFn: (verifyUserPost) => {
      return api.post(
        "auth/register/verify/phone",
        {
          phoneNumber: userDetails.phoneNumber,
          otp: tillNumberParts,
        },
        {
          method: "POST",
        }
      );
    },
    onSuccess: (data, variables, context) => {
      // If verification returns a token, user is fully registered and logged in
      if (data.data.token) {
        login(data); // Use the login function from your context
        setOpenSigningUp(false);
        router.replace("/home");
      } else {
        // Otherwise, proceed with login
        loginUser.mutate(userDetails);
      }
    },
    onError: (error, variables, context) => {
      // Handle errors, e.g., invalid OTP
      console.error("Failed to verify OTP.");
      setOpenAccErr(true);
    },
    onSettled: (data, error, variables, context) => {
      console.log(data);
    },
  });

  const verifyOTP = async (otpData: OTPFormData) => {
    if (!userDetails) return; // Ensure userDetails is not null
    // console.log(otpData.otp);
    
    // Call the verify API with stored user details and provided OTP
    const promise = verifyUser.mutate();
    console.log("promise", promise);
    
  };

  return (
    <section className="app-background">
      <Dialog open={openOTP} onOpenChange={setOpenOTP}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">
              Confirm OTP-code sent to Phone Number
            </DialogTitle>
            <hr className="my-4" />
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
                        const nextInput = document.querySelector(`input[data-signup-index="${index + 1}"]`) as HTMLInputElement;
                        if (nextInput) nextInput.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace to focus previous input
                      if (e.key === "Backspace" && !tillNumberParts[index] && index > 0 && typeof document !== 'undefined') {
                        const prevInput = document.querySelector(`input[data-signup-index="${index - 1}"]`) as HTMLInputElement;
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    data-signup-index={index}
                    className="w-10 h-10 text-center text-lg font-semibold border border-black rounded-lg focus:border-[#0795B0] focus:outline-none bg-white text-black"
                  />
                ))}
              </div>
              <button
                type="submit"
                className="bg-black text-white font-semibold rounded-lg p-3 w-auto"
              >
                Confirm OTP Code
              </button>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <LoadingDialog
        message="Creating Account"
        openLoading={openSigningUp}
        setOpenLoading={setOpenSigningUp}
      />
      <LoadingDialog
        message="Sending OTP Code...."
        openLoading={openConfirmingOTP}
        setOpenLoading={setOpenConfirmingOTP}
      />
      <ErrorDialog
        message={errorMessage}
        openError={openAccErr}
        setOpenError={setOpenAccErr}
      />
      <article>
        <h2 className="text-4xl text-white font-bold">Sign Up to DotPay</h2>
        <h4 className="text-white my-5">
          Enter your Details to Sign Up to DotPay
        </h4>
        {/* SignUp using Formik */}
        <Formik
          initialValues={{
            phoneNumber: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={Yup.object({
            phoneNumber: Yup.number()
              .min(13, "Min of 13 Characters required")
              .required("Phone Number is Required"),
            password: Yup.string()
              .max(20, "Must be 20 characters or less")
              .min(5, "Min of 5 Characters required")
              .required("Password is Required"),
            confirmPassword: Yup.string()
              .max(20, "Must be 20 characters or less")
              .min(5, "Min of 5 Characters required")
              .oneOf([Yup.ref("password"), undefined], "Passwords must match")
              .required("Confirm Password is Required"),
          })}
          onSubmit={(values, { setSubmitting }) => {
            setTimeout(async () => {
              setOpenSigningUp(true);
              
              // Format phone number to E.164 format using utility function
              const formattedPhoneNumber = formatPhoneNumberToE164(values.phoneNumber);
              
              // Validate the formatted phone number
              if (!validateE164PhoneNumber(formattedPhoneNumber)) {
                console.error('Invalid phone number format:', formattedPhoneNumber);
                setOpenSigningUp(false);
                setOpenAccErr(true);
                setSubmitting(false);
                return;
              }

              // Use the formatted phone number in your API request
              const requestData = {
                ...values,
                phoneNumber: formattedPhoneNumber, // Now properly formatted as E.164
              };

              // Call the Initiate Register User Mutation
              console.log('Formatted request data:', requestData);
              initiateRegisterUser.mutate(requestData);
              setOpenSigningUp(false);
              setSubmitting(false);
            }, 400);
          }}
        >
          <Form>
            <TextInput
              label="Phone Number"
              name="phoneNumber"
              type="number"
              placeholder="Enter your Phone Number eg (0720****20)"
            />

            <PasswordInput
              label="Password"
              name="password"
              placeholder="Enter your Password"
            />

            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Confirm your Password"
            />
            <div className="flex flex-col justify-start mb-5">
              <p className="text-[#909090] p-1 text-sm font-semibold">
                Have an account?{" "}
                <Link href="/login" className="hover:text-white text-gray-300">
                  Login
                </Link>
              </p>
              <p className="text-[#909090] p-1 text-sm font-semibold">
                <Link href="/signup/business" className="hover:text-white">
                  Create a Business Account?
                </Link>
              </p>
            </div>
            <button
              type="submit"
              className="bg-white mt-5 p-3 rounded-full font-bold w-full cursor-pointer"
            >
              Submit
            </button>
          </Form>
        </Formik>

        {/* Google Sign-In */}
        <div className="mt-6">
          <div className="flex items-center justify-center mb-4">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="px-4 text-white text-sm">or</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>
          <GoogleSignIn 
            mode="signup"
            onSuccess={() => {
              setOpenSigningUp(true);
              setTimeout(() => {
                router.replace("/home");
              }, 1000);
            }}
            onError={(error) => {
              console.error("Google signup error:", error);
              setOpenAccErr(true);
            }}
          />
        </div>
      </article>
    </section>
  );
};

export default Signup;
