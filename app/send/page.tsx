// "use client";

// import { useEffect, useState } from "react";
// import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { ArrowLeft, ArrowsLeftRight, Scan } from "@phosphor-icons/react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useBalance } from "@/context/BalanceContext";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Player } from "@lottiefiles/react-lottie-player";
// import lottieSuccess from "@/json/success.json";
// import * as Yup from "yup";
// import lottieConfirm from "@/json/loading.json";
// import { Form, Formik, useFormikContext } from "formik";
// import TextInput from "@/components/inputs/TextInput";
// import PasswordInput from "@/components/inputs/PasswordInput";
// import SelectInput from "@/components/inputs/SelectInput";
// import { useGetConversionRate } from "@/hooks/apiHooks";
// import { ConversionRateType } from "@/types/api-types";
// import { useMutation } from "@tanstack/react-query";
// import useAxios from "@/hooks/useAxios";
// import SuccessDialog from "@/components/dialog/SuccessDialog";
// import TransactionSuccessDialog from "@/components/dialog/TranscationSuccessDialog";
// import ErrorDialog from "@/components/dialog/ErrorDialog";

// type FormValues = { phoneNumber: string; amount: string };
// const Send = () => {
//   const router = useRouter();
//   const {
//     register,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm<FormValues>();
//   const [conversionRate, setConversionRate] = useState<number>(1); // Default to 1 for direct 1-to-1 conversion if not fetched
//   const [currency, setCurrency] = useState("usdc");
//   const [equivalentAmount, setEquivalentAmount] = useState("");
//   const [wallet, setWallet] = useState();
//   const [transactionFee, setTransactionFee] = useState(0); // State to hold the calculated transaction fee
//   const [openSuccess, setOpenSuccess] = useState(false); // Opens the Success Dialog
//   const [openConfirmTx, setOpenConfirmTx] = useState(false); // Opens the Transaction Dialog
//   const [openConfirmingTx, setOpenConfirmingTx] = useState(false); // Opens the Transaction Loading Dialog
//   const [finAmount, setFinAmount] = useState(0);
//   const [openAccErr, setOpenAccErr] = useState(false); // Opens the Failed Acc Creation Loading Dialog
//   const api = useAxios();

//   const { data, isLoading, error } = useGetConversionRate();
//   useEffect(() => {
//     const user = localStorage.getItem("user"); // Retrieves a string
//     const userObject = JSON.parse(user ?? ""); // Parses the string back into an object
//     setWallet(userObject.data.walletAddress);
//     setConversionRate(data);
//   }, []);

//   const recipientNo = watch("phoneNumber");
//   const amount = watch("amount");

//   const calculateTransactionFee = (amount: number) => {
//     if (amount <= 1) return 0;
//     if (amount <= 5) return 0.05;
//     if (amount <= 10) return 0.1;
//     if (amount <= 15) return 0.2;
//     if (amount <= 25) return 0.3;
//     if (amount <= 35) return 0.45;
//     if (amount <= 50) return 0.5;
//     if (amount <= 75) return 0.68;
//     if (amount <= 100) return 0.79;
//     if (amount <= 150) return 0.88;
//     return 0.95; // For amounts above $150.01
//   };

//   useEffect(() => {
//     if (amount) {
//       const fee = calculateTransactionFee(parseFloat(amount));
//       setTransactionFee(fee);
//       // console.log(amount);
//     } else {
//       setTransactionFee(0);
//     }
//   }, [amount]);

//   useEffect(() => {
//     if (!amount) setEquivalentAmount("");
//     else {
//       // If the user is inputting KSH, convert to USDC by dividing by the rate
//       // If the user is inputting USDC, convert to KSH by multiplying by the rate
//       const convertedAmount =
//         currency === "ksh"
//           ? parseFloat(amount) / conversionRate
//           : parseFloat(amount) * conversionRate;
//       setEquivalentAmount(
//         `${convertedAmount.toFixed(2)} ${currency === "usdc" ? "KSH" : "USDC"}`
//       );
//       // console.log(parseFloat(amount) / conversionRate);
//     }
//   }, [amount, currency, conversionRate]);

//   const validateInput = (value: string) => {
//     // Ethereum address validation (basic)
//     const isEthereumAddress = value.startsWith("0x") && value.length === 42;
//     // Basic phone number validation
//     const isPhoneNumber = /^(07|\+254|254)\d{8,}$/.test(value);

//     return (
//       isEthereumAddress ||
//       isPhoneNumber ||
//       "Please enter Arbitrum Wallet address or phone number"
//     );
//   };

//   // Mutation to SendToken
//   const sendToken = useMutation({
//     mutationFn: (sendTokenData: { phoneNumber: string; amount: string }) => {
//       console.log(sendTokenData);
//       const finalAmount =
//         currency === "ksh"
//           ? (parseFloat(sendTokenData.amount) / conversionRate).toFixed(2)
//           : parseFloat(sendTokenData.amount).toFixed(2);
//       console.log(finalAmount);
//       let modifiedPhoneNumber = sendTokenData.phoneNumber;
//       if (
//         modifiedPhoneNumber.toString().startsWith("01") ||
//         modifiedPhoneNumber.toString().startsWith("07")
//       ) {
//         modifiedPhoneNumber = "+254" + recipientNo.substring(1);
//       }
//       return api.post(
//         "token/sendToken",
//         {
//           tokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
//           recipientIdentifier: modifiedPhoneNumber,
//           amount: finalAmount,
//           senderAddress: wallet, // Assuming you have a way to input or fetch the wallet address
//         },
//         {
//           method: "POST",
//         }
//       );
//     },
//     onSuccess: (data, variables, context) => {
//       setOpenConfirmingTx(true);
//       router.replace("/home");
//       // setOpenConfirmTx(false);
//       // setOpenConfirmingTx(false);
//       // setOpenSuccess(true);
//     },
//     onError: (error, variables, context) => {
//       console.error("Error:", error);
//       // setDialogLoading(false);
//       // setOpenConfirmTx(false);
//       // setOpenConfirmingTx(false);
//       setOpenAccErr(true);
//     },
//     onSettled: (data, error, variables, context) => {},
//   });

//   const submitSend: SubmitHandler<FormValues> = async (data) => {
//     setOpenConfirmTx(true);
//     // Use the converted amount if the selected currency is KSH
//     // const finalAmount = currency === 'ksh' ? parseFloat(amount) * conversionRate : parseFloat(amount);
//     const fee = calculateTransactionFee(parseFloat(amount));
//     setTransactionFee(fee);
//   };

//   const confirmSend = async () => {
//     const data = {
//       phoneNumber: recipientNo,
//       amount: amount,
//     };
//     console.log("formdata", data);
//     sendToken.mutate(data);
//     setTimeout(() => {
//       setOpenConfirmTx(false);
//     }, 1000);
//   };

//   return (
//     <section className="home-background h-screen flex flex-col p-5 xl:px-[200px]">
//       {/* UI elements remain unchanged */}
//       <div className="flex justify-between">
//         <span className="flex flex-col items-center w-full">
//           <span className="flex items-center justify-between w-full mb-3">
//             <Link href="/home">
//               <ArrowLeft size={24} color="#ffffff" />
//             </Link>
//             <h3 className="text-[#A4A4A4] text-lg ">Send Crypto</h3>
//             <Scan size={24} color="#ffffff" />
//           </span>
//           <span className="flex items-center justify-between w-full text-white ">
//             <h1 className="text-lg font-bold text-center">
//               {equivalentAmount && (
//                 <p>
//                   {amount} {currency === "usdc" ? "USDC" : "KSH"}
//                 </p>
//               )}
//             </h1>
//             <ArrowsLeftRight
//               size={24}
//               weight="bold"
//               className="text-white mx-1"
//             />
//             <h1 className="text-lg font-bold text-center">
//               {equivalentAmount && <p>{equivalentAmount}</p>}
//             </h1>
//           </span>
//         </span>
//       </div>

//       <form id="sendForm" onSubmit={handleSubmit(submitSend)} className="mt-10">
//         {/* Currency Selection */}
//         <Select value={currency} onValueChange={setCurrency}>
//           <SelectTrigger className="border border-[#0795B0] rounded-lg px-4 py-6 bg-transparent text-white text-sm outline-none">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent className="border border-[#0795B0] rounded-lg bg-black text-white text-sm outline-none">
//             <SelectItem value="usdc">USDC</SelectItem>
//             <SelectItem value="ksh">KSH</SelectItem>
//           </SelectContent>
//         </Select>
//         {/* Amount Input */}
//         <input
//           {...register("amount", { required: true, min: 0.01 })}
//           type="number"
//           step="0.01"
//           placeholder="Enter Amount"
//           className="border border-[#0795B0] w-full rounded-lg px-4 py-4 bg-transparent text-white text-sm outline-none mt-5"
//         />
//         {errors.amount && (
//           <p className="text-red-500">
//             Amount is required and must be greater than 0.
//           </p>
//         )}

//         <input
//           {...register("phoneNumber", {
//             required: "This field is required",
//             validate: validateInput,
//           })}
//           type="text" // Change type to text to accommodate both formats
//           placeholder="Recipient's Phone Number or Wallet Address"
//           className="border border-[#0795B0] w-full rounded-lg px-2 py-6 bg-transparent text-white text-sm outline-none mt-5"
//         />
//         {errors.phoneNumber?.message && (
//           <p className="text-red-500">{errors.phoneNumber.message}</p>
//         )}
//         {/* Send Button */}
//         <button
//           type="submit"
//           className="bg-white font-bold text-lg p-3 rounded-xl w-full mt-5"
//         >
//           Send
//         </button>

//         <Dialog open={openConfirmTx} onOpenChange={setOpenConfirmTx}>
//           <DialogContent className="max-w-lg">
//             <DialogHeader>
//               <DialogTitle className="mb-[5px]">Confirm Payment</DialogTitle>
//               <DialogDescription>
//                 Confirm Transaction Payment of {amount}{" "}
//                 {currency === "usdc" ? "USDC" : "KSH"}
//               </DialogDescription>
//               <DialogDescription>
//                 With Transaction fee of {transactionFee}
//               </DialogDescription>
//               <div className="my-3">
//                 <Player
//                   keepLastFrame
//                   autoplay
//                   loop={true}
//                   src={lottieConfirm}
//                   style={{ height: "200px", width: "200px" }}
//                 ></Player>
//               </div>

//               <button
//                 type="submit"
//                 className=" font-bold text-lg p-3 rounded-xl w-full mt-5 text-white border-2  bg-blue-500"
//                 onClick={() => confirmSend()}
//               >
//                 Confirm
//               </button>

//               <button
//                 className="bg-red-500 font-bold text-lg p-3 rounded-xl w-full mt-5 text-white"
//                 onClick={() => setOpenConfirmTx(false)}
//               >
//                 Cancel Payment
//               </button>
//             </DialogHeader>
//           </DialogContent>
//         </Dialog>
//         <TransactionSuccessDialog
//           message="Confirm Payment"
//           openSuccess={openConfirmingTx}
//           setOpenSuccess={setOpenConfirmingTx}
//           amount={amount}
//           currency={currency}
//         />
//         <ErrorDialog
//           message="Transaction Failed"
//           openError={openAccErr}
//           setOpenError={setOpenAccErr}
//         />
//       </form>
//       <Dialog open={openSuccess} onOpenChange={setOpenSuccess}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle className="mb-[20px]">
//               {finAmount}
//               {currency === "usdc" ? " USDC" : " KSH"} Transferred Succesfully
//             </DialogTitle>
//             <Player
//               keepLastFrame
//               src={lottieSuccess}
//               style={{ height: "300px", width: "300px" }}
//             ></Player>
//             <button
//               className="bg-white font-bold text-lg p-3 rounded-xl w-full mt-5 text-black"
//               onClick={() => setOpenSuccess(false)}
//             >
//               Done
//             </button>
//           </DialogHeader>
//         </DialogContent>
//       </Dialog>
//     </section>
//   );
// };

// export default Send;


// "use client";

// import { useEffect, useState } from "react";
// import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { ArrowLeft, ArrowsLeftRight, Scan } from "@phosphor-icons/react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useBalance } from "@/context/BalanceContext";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Player } from "@lottiefiles/react-lottie-player";
// import lottieSuccess from "@/json/success.json";
// import lottieConfirm from "@/json/loading.json";
// import { useGetConversionRate } from "@/hooks/apiHooks";
// import { ConversionRateType } from "@/types/api-types";
// import { useMutation } from "@tanstack/react-query";
// import useAxios from "@/hooks/useAxios";
// import SuccessDialog from "@/components/dialog/SuccessDialog";
// import TransactionSuccessDialog from "@/components/dialog/TranscationSuccessDialog";
// import ErrorDialog from "@/components/dialog/ErrorDialog";
// import { useToast } from "@/components/ui/use-toast";

// type FormValues = { phoneNumber: string; amount: string };

// const Send = () => {
//   const { toast } = useToast();
//   const router = useRouter();
//   const {
//     register,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm<FormValues>();
//   const [conversionRate, setConversionRate] = useState<number>(1); // Default to 1 for direct 1-to-1 conversion if not fetched
//   const [currency, setCurrency] = useState("usdc");
//   const [equivalentAmount, setEquivalentAmount] = useState("");
//   const [wallet, setWallet] = useState<string | undefined>();
//   const [transactionFee, setTransactionFee] = useState(0); // State to hold the calculated transaction fee
//   const [openSuccess, setOpenSuccess] = useState(false); // Opens the Success Dialog
//   const [openConfirmTx, setOpenConfirmTx] = useState(false); // Opens the Transaction Dialog
//   const [openConfirmingTx, setOpenConfirmingTx] = useState(false); // Opens the Transaction Loading Dialog
//   const [finAmount, setFinAmount] = useState(0);
//   const [openAccErr, setOpenAccErr] = useState(false); // Opens the Failed Acc Creation Loading Dialog
//   const api = useAxios();

//   const { data, isLoading, error } = useGetConversionRate();

//   useEffect(() => {
//     const user = localStorage.getItem("user"); // Retrieves a string
//     const userObject = JSON.parse(user ?? "{}"); // Parses the string back into an object
//     setWallet(userObject.data?.walletAddress);
//     isLoading ? 0 : setConversionRate(data??0);
//   }, [data]);

//   const recipientNo = watch("phoneNumber");
//   const amount = watch("amount");

//   const calculateTransactionFee = (amount: number) => {
//     if (amount <= 1) return 0;
//     if (amount <= 5) return 0.05;
//     if (amount <= 10) return 0.1;
//     if (amount <= 15) return 0.2;
//     if (amount <= 25) return 0.3;
//     if (amount <= 35) return 0.45;
//     if (amount <= 50) return 0.5;
//     if (amount <= 75) return 0.68;
//     if (amount <= 100) return 0.79;
//     if (amount <= 150) return 0.88;
//     return 0.95; // For amounts above $150.01
//   };

//   useEffect(() => {
//     if (amount) {
//       const fee = calculateTransactionFee(parseFloat(amount));
//       setTransactionFee(fee);
//       // console.log(amount);
//     } else {
//       setTransactionFee(0);
//     }
//   }, [amount]);

//   useEffect(() => {
//     if (!amount) setEquivalentAmount("");
//     else {
//       // If the user is inputting KSH, convert to USDC by dividing by the rate
//       // If the user is inputting USDC, convert to KSH by multiplying by the rate
//       const convertedAmount =
//         currency === "ksh"
//           ? parseFloat(amount) / conversionRate
//           : parseFloat(amount) * conversionRate;
//       setEquivalentAmount(
//         `${convertedAmount.toFixed(2)} ${currency === "usdc" ? "KSH" : "USDC"}`
//       );
//       // console.log(parseFloat(amount) / conversionRate);
//     }
//   }, [amount, currency, conversionRate]);

//   const validateInput = (value: string) => {
//     // Ethereum address validation (basic)
//     const isEthereumAddress = value.startsWith("0x") && value.length === 42;
//     // Basic phone number validation
//     const isPhoneNumber = /^(07|\+254|254)\d{8,}$/.test(value);

//     return (
//       isEthereumAddress ||
//       isPhoneNumber ||
//       "Please enter Arbitrum Wallet address or phone number"
//     );
//   };

//   // Mutation to SendToken
//   const sendToken = useMutation({
//     mutationFn: (sendTokenData: { phoneNumber: string; amount: string }) => {
//       console.log(sendTokenData);
//       const finalAmount =
//         currency === "ksh"
//           ? (parseFloat(sendTokenData.amount) / conversionRate).toFixed(2)
//           : parseFloat(sendTokenData.amount).toFixed(2);
//       console.log(finalAmount);
//       let modifiedPhoneNumber = sendTokenData.phoneNumber;
//       if (
//         modifiedPhoneNumber.toString().startsWith("01") ||
//         modifiedPhoneNumber.toString().startsWith("07")
//       ) {
//         modifiedPhoneNumber = "+254" + recipientNo.substring(1);
//       }
//       toast({
//         description: "Confirming Transaction...",
//       })
//       return api.post(
//         "token/sendToken",
//         {
//           tokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
//           recipientIdentifier: modifiedPhoneNumber,
//           amount: finalAmount,
//           senderAddress: wallet, // Assuming you have a way to input or fetch the wallet address
//         },
//         {
//           method: "POST",
//         }
//       );
//     },
//     onSuccess: (data, variables, context) => {
//       setOpenConfirmingTx(true);
//       setTimeout(()=>{
//         router.replace("/home");
//       }, 2000);
//       // setOpenConfirmTx(false);
//       // setOpenConfirmingTx(false);
//       // setOpenSuccess(true);
//     },
//     onError: (error, variables, context) => {
//       console.error("Error:", error);
//       // setDialogLoading(false);
//       // setOpenConfirmTx(false);
//       // setOpenConfirmingTx(false);
//       setOpenAccErr(true);
//     },
//     onSettled: (data, error, variables, context) => {},
//   });

//   const submitSend: SubmitHandler<FormValues> = async (data) => {
//     setOpenConfirmTx(true);
//     // Use the converted amount if the selected currency is KSH
//     // const finalAmount = currency === 'ksh' ? parseFloat(amount) * conversionRate : parseFloat(amount);
//     const fee = calculateTransactionFee(parseFloat(amount));
//     setTransactionFee(fee);
//   };

//   const confirmSend = async () => {
//     const data = {
//       phoneNumber: recipientNo,
//       amount: amount,
//     };
//     console.log("formdata", data);
//     sendToken.mutate(data);
//     setTimeout(() => {
//       setOpenConfirmTx(false);
//     }, 1000);
//   };

//   return (
//     <section className="home-background h-screen flex flex-col p-5 xl:px-[200px]">
//       {/* UI elements remain unchanged */}
//       <div className="flex justify-between">
//         <span className="flex flex-col items-center w-full">
//           <span className="flex items-center justify-between w-full mb-3">
//             <Link href="/home">
//               <ArrowLeft size={24} color="#ffffff" />
//             </Link>
//             <h3 className="text-[#A4A4A4] text-lg ">Send Crypto</h3>
//             <Scan size={24} color="#ffffff" />
//           </span>
//           <span className="flex items-center justify-between w-full text-white ">
//             <h1 className="text-lg font-bold text-center">
//               {equivalentAmount && (
//                 <p>
//                   {amount} {currency === "usdc" ? "USDC" : "KSH"}
//                 </p>
//               )}
//             </h1>
//             <ArrowsLeftRight
//               size={24}
//               weight="bold"
//               className="text-white mx-1"
//             />
//             <h1 className="text-lg font-bold text-center">
//               {equivalentAmount && <p>{equivalentAmount}</p>}
//             </h1>
//           </span>
//         </span>
//       </div>

//       <form id="sendForm" onSubmit={handleSubmit(submitSend)} className="mt-10">
//         {/* Currency Selection */}
//         <Select value={currency} onValueChange={setCurrency}>
//           <SelectTrigger className="border border-[#0795B0] rounded-lg px-4 py-6 bg-transparent text-white text-sm outline-none">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent className="border border-[#0795B0] rounded-lg bg-black text-white text-sm outline-none">
//             <SelectItem value="usdc">USDC</SelectItem>
//             <SelectItem value="ksh">KSH</SelectItem>
//           </SelectContent>
//         </Select>
//         {/* Amount Input */}
//         <input
//           {...register("amount", { required: true, min: 0.01 })}
//           type="number"
//           step="0.01"
//           placeholder="Enter Amount"
//           className="border border-[#0795B0] w-full rounded-lg px-4 py-4 bg-transparent text-white text-sm outline-none mt-5"
//         />
//         {errors.amount && (
//           <p className="text-red-500">
//             Amount is required and must be greater than 0.
//           </p>
//         )}

//         <input
//           {...register("phoneNumber", {
//             required: "This field is required",
//             validate: validateInput,
//           })}
//           type="text" // Change type to text to accommodate both formats
//           placeholder="Recipient's Phone Number or Wallet Address"
//           className="border border-[#0795B0] w-full rounded-lg px-2 py-6 bg-transparent text-white text-sm outline-none mt-5"
//         />
//         {errors.phoneNumber?.message && (
//           <p className="text-red-500">{errors.phoneNumber.message}</p>
//         )}
//         {/* Send Button */}
//         <button
//           type="submit"
//           className="bg-white font-bold text-lg p-3 rounded-xl w-full mt-5"
//         >
//           Send
//         </button>

//         <Dialog open={openConfirmTx} onOpenChange={setOpenConfirmTx}>
//           <DialogContent className="max-w-lg">
//             <DialogHeader>
//               <DialogTitle className="mb-[5px]">Confirm Payment</DialogTitle>
//               <DialogDescription>
//                 Confirm Transaction Payment of {amount}{" "}
//                 {currency === "usdc" ? "USDC" : "KSH"}
//               </DialogDescription>
//               <DialogDescription>
//                 With Transaction fee of {transactionFee}
//               </DialogDescription>
//               <div className="my-3">
//                 <Player
//                   keepLastFrame
//                   autoplay
//                   loop={true}
//                   src={lottieConfirm}
//                   style={{ height: "200px", width: "200px" }}
//                 ></Player>
//               </div>

//               <button
//                 type="submit"
//                 className=" font-bold text-lg p-3 rounded-xl w-full mt-5 text-white border-2  bg-blue-500"
//                 onClick={() => confirmSend()}
//               >
//                 Confirm
//               </button>

//               <button
//                 className="bg-red-500 font-bold text-lg p-3 rounded-xl w-full mt-5 text-white"
//                 onClick={() => setOpenConfirmTx(false)}
//               >
//                 Cancel Payment
//               </button>
//             </DialogHeader>
//           </DialogContent>
//         </Dialog>
//         <TransactionSuccessDialog
//           message="Confirm Payment"
//           openSuccess={openConfirmingTx}
//           setOpenSuccess={setOpenConfirmingTx}
//           amount={amount}
//           currency={currency}
//         />
//         <ErrorDialog
//           message="Transaction Failed"
//           openError={openAccErr}
//           setOpenError={setOpenAccErr}
//         />
//       </form>
//       <Dialog open={openSuccess} onOpenChange={setOpenSuccess}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle className="mb-[20px]">
//               {finAmount}
//               {currency === "usdc" ? " USDC" : " KSH"} Transferred Succesfully
//             </DialogTitle>
//             <Player
//               keepLastFrame
//               src={lottieSuccess}
//               style={{ height: "300px", width: "300px" }}
//             ></Player>
//             <button
//               className="bg-white font-bold text-lg p-3 rounded-xl w-full mt-5 text-black"
//               onClick={() => setOpenSuccess(false)}
//             >
//               Done
//             </button>
//           </DialogHeader>
//         </DialogContent>
//       </Dialog>
//     </section>
//   );
// };

// export default Send;


// Send.tsx
"use client";

import { useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowsLeftRight, Scan } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import lottieSuccess from "@/json/success.json";
import lottieConfirm from "@/json/loading.json";

// Dynamically import Player to avoid SSR issues
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);
import { useGetConversionRate } from "@/hooks/apiHooks";
import { ConversionRateType } from "@/types/api-types";
import { useMutation } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios";
import SuccessDialog from "@/components/dialog/SuccessDialog";
import TransactionSuccessDialog from "@/components/dialog/TranscationSuccessDialog";
import ErrorDialog from "@/components/dialog/ErrorDialog";
import { useToast } from "@/components/ui/use-toast";
import { useChain } from "@/context/ChainContext"; // Import useChain hook
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";

type FormValues = { phoneNumber: string; amount: string };

const chainTokenAddresses: Record<string, string> = {
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  celo: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
};

const Send = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { chain } = useChain(); // Use the selected chain from ChainContext
  const { user, isAuthenticated } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>();
  const [conversionRate, setConversionRate] = useState<number>(1); // Default to 1 for direct 1-to-1 conversion if not fetched
  const [currency, setCurrency] = useState("usdc");
  const [equivalentAmount, setEquivalentAmount] = useState("");
  const [wallet, setWallet] = useState<string | undefined>();
  const [transactionFee, setTransactionFee] = useState(0); // State to hold the calculated transaction fee
  const [openSuccess, setOpenSuccess] = useState(false); // Opens the Success Dialog
  const [openConfirmTx, setOpenConfirmTx] = useState(false); // Opens the Transaction Dialog
  const [openConfirmingTx, setOpenConfirmingTx] = useState(false); // Opens the Transaction Loading Dialog
  const [finAmount, setFinAmount] = useState(0);
  const [openAccErr, setOpenAccErr] = useState(false); // Opens the Failed Acc Creation Loading Dialog
  const [insufficientInfo, setInsufficientInfo] = useState<{ available: number; token: string; chain: string } | null>(null);
  const [successTx, setSuccessTx] = useState<{ 
    hash?: string; 
    explorerUrl?: string; 
    transactionCategory?: string;
    transactionSubType?: string;
  } | null>(null);
  const api = useAxios();

  const { data, isLoading, error } = useGetConversionRate();

  useEffect(() => {
    if (user && isAuthenticated) {
      // Safe access to wallet addresses with fallbacks
      const walletAddress = chain === "arbitrum" 
        ? user.arbitrumWallet || user.walletAddress || ""
        : user.celoWallet || user.walletAddress || "";

      setWallet(walletAddress);
      console.log("Wallet set to:", walletAddress);

      // Fallback: fetch from /token/receive if not available from user profile
      if (!walletAddress) {
        api.get('token/receive')
          .then((res) => {
            const addr = res?.data?.data?.walletAddress;
            if (addr) {
              setWallet(addr);
              console.log('Wallet fetched from /token/receive:', addr);
            }
          })
          .catch((e) => {
            console.warn('Failed to fetch wallet from /token/receive', e);
          });
      }
    }
    
    if (!isLoading && data) {
      setConversionRate(data);
    }
  }, [data, chain, isLoading, user, isAuthenticated]);

  useEffect(() => {
    console.log("Wallet address updated:", wallet);
  }, [wallet]);

  const recipientNo = watch("phoneNumber");
  const amount = watch("amount");

  const calculateTransactionFee = (amount: number) => {
    if (amount <= 1) return 0;
    if (amount <= 5) return 0.05;
    if (amount <= 10) return 0.1;
    if (amount <= 15) return 0.2;
    if (amount <= 25) return 0.3;
    if (amount <= 35) return 0.45;
    if (amount <= 50) return 0.5;
    if (amount <= 75) return 0.68;
    if (amount <= 100) return 0.79;
    if (amount <= 150) return 0.88;
    return 0.95; // For amounts above $150.01
  };

  useEffect(() => {
    if (amount) {
      const fee = calculateTransactionFee(parseFloat(amount));
      setTransactionFee(fee);
    } else {
      setTransactionFee(0);
    }
  }, [amount]);

  useEffect(() => {
    if (!amount) {
      setEquivalentAmount("");
    } else {
      let convertedAmount;
      let targetCurrency;

      if (currency === "ksh") {
        // If the user is inputting KSH, convert to USDC
        convertedAmount = parseFloat(amount) / conversionRate;
        targetCurrency = "USDC";
      } else if (currency === "usdc" || currency === "usdt") {
        // If the user is inputting USDC or USDT, convert to KSH
        convertedAmount = parseFloat(amount) * conversionRate;
        targetCurrency = "KSH";
      }

      setEquivalentAmount(
        `${convertedAmount?.toFixed(2)} ${targetCurrency}`
      );
    }
  }, [amount, currency, conversionRate]);

  const validateInput = (value: string) => {
    // Ethereum address validation (basic)
    const isEthereumAddress = value.startsWith("0x") && value.length === 42;
    // Basic phone number validation
    const isPhoneNumber = /^(07|\+254|254)\d{8,}$/.test(value);

    return (
      isEthereumAddress ||
      isPhoneNumber ||
      "Please enter a valid wallet address or phone number"
    );
  };

  // Mutation to SendToken
  const sendToken = useMutation({
    mutationFn: (sendTokenData: { phoneNumber: string; amount: string }) => {
      const finalAmount =
        currency === "ksh"
          ? (parseFloat(sendTokenData.amount) / conversionRate).toFixed(2)
          : parseFloat(sendTokenData.amount).toFixed(2);
      let modifiedPhoneNumber = sendTokenData.phoneNumber;
      if (
        modifiedPhoneNumber.toString().startsWith("01") ||
        modifiedPhoneNumber.toString().startsWith("07")
      ) {
        modifiedPhoneNumber = "+254" + recipientNo.substring(1);
      }

      const payload = {
        tokenAddress: chainTokenAddresses[chain], // Use the token address based on the selected chain
        recipientIdentifier: modifiedPhoneNumber,
        amount: finalAmount,
        senderAddress: wallet, // Use the wallet address based on the selected chain
        chain: chain, // Include the selected chain
      };

      if (!payload.senderAddress) {
        console.error("Sender address is not defined:", payload);
        throw new Error("Sender address is not defined");
      }

      console.log("Payload being sent:", payload);

      return api.post("token/sendToken", payload, {
        method: "POST",
      });
    },
    onSuccess: (data, variables, context) => {
      try {
        const resp = (data as any)?.data || data;
        const payload = resp?.data || resp;
        const hash = payload?.transaction?.hash || payload?.transactionHash;
        const explorerUrl = payload?.transaction?.explorerUrl || payload?.explorerUrl;
        const transactionCategory = payload?.transactionCategory || payload?.transaction?.category;
        const transactionSubType = payload?.transactionSubType || payload?.transaction?.subType;
        setSuccessTx({ hash, explorerUrl, transactionCategory, transactionSubType });
      } catch {}
      setOpenConfirmingTx(true);
      setTimeout(() => {
        router.replace("/home");
      }, 2000);
    },
    onError: (error, variables, context) => {
      console.error("Error:", error);
      const code = (error as any)?.response?.data?.error?.code;
      if (code === 'INSUFFICIENT_TOKEN_BALANCE') {
        const available = (error as any)?.response?.data?.error?.available;
        const token = (error as any)?.response?.data?.error?.token || (currency === 'usdt' ? 'USDT' : 'USDC');
        const errChain = (error as any)?.response?.data?.error?.chain || chain;
        setInsufficientInfo({ available: Number(available), token, chain: errChain });
        toast({
          title: 'Insufficient balance',
          description: `You have ${available} ${token} on ${errChain}. You can auto-fill the maximum available amount.`,
        });
        return;
      }
      setOpenAccErr(true);
    },
    onSettled: (data, error, variables, context) => {},
  });

  const submitSend: SubmitHandler<FormValues> = async (data) => {
    setOpenConfirmTx(true);
    const fee = calculateTransactionFee(parseFloat(amount));
    setTransactionFee(fee);
  };

  const confirmSend = async () => {
    const data = {
      phoneNumber: recipientNo,
      amount: amount,
    };
    sendToken.mutate(data);
    setTimeout(() => {
      setOpenConfirmTx(false);
    }, 1000);
  };

  const getCurrencyLabel = (curr:any) => {
    switch (curr.toLowerCase()) {
      case 'usdc':
        return 'USDC';
      case 'usdt':
        return 'USDT';
      case 'ksh':
        return 'KSH';
      default:
        return curr.toUpperCase();
    }
  };

  return (
    <AuthGuard>
      <section className="home-background h-screen flex flex-col p-5 xl:px-[200px]">
      <div className="flex justify-between">
        <span className="flex flex-col items-center w-full">
          <span className="flex items-center justify-between w-full mb-3">
            <Link href="/home">
              <ArrowLeft size={24} color="#ffffff" />
            </Link>
            <h3 className="text-[#A4A4A4] text-lg ">Send Crypto</h3>
            <Scan size={24} color="#ffffff" />
          </span>
          <span className="flex items-center justify-between w-full text-white ">
            <h1 className="text-lg font-bold text-center">
              {equivalentAmount && (
                <p>
                  {amount} {getCurrencyLabel(currency)}
                </p>
              )}
            </h1>
            <ArrowsLeftRight
              size={24}
              weight="bold"
              className="text-white mx-1"
            />
            <h1 className="text-lg font-bold text-center">
              {equivalentAmount && <p>{equivalentAmount}</p>}
            </h1>
          </span>
        </span>
      </div>

      {insufficientInfo && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm">Insufficient balance. Available: <span className="font-medium">{insufficientInfo.available} {insufficientInfo.token}</span> on {insufficientInfo.chain}.</p>
              <p className="text-xs opacity-80">Tap to auto-fill the maximum available amount.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const maxInCurrentCurrency = currency === 'ksh' 
                  ? (Number(insufficientInfo.available) * conversionRate).toFixed(2)
                  : String(insufficientInfo.available);
                setValue('amount', maxInCurrentCurrency, { shouldValidate: true, shouldDirty: true });
              }}
              className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              Use max
            </button>
          </div>
        </div>
      )}

      <form id="sendForm" onSubmit={handleSubmit(submitSend)} className="mt-10">
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="border border-[#0795B0] rounded-lg px-4 py-6 bg-transparent text-white text-sm outline-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-[#0795B0] rounded-lg bg-black text-white text-sm outline-none">
            <SelectItem value="usdc">USDC</SelectItem>
            <SelectItem value="usdt">USDT</SelectItem>
            <SelectItem value="ksh">KSH</SelectItem>
          </SelectContent>
        </Select>

        <input
          {...register("amount", { required: true, min: 0.01 })}
          type="number"
          step="0.01"
          placeholder="Enter Amount"
          className="border border-[#0795B0] w-full rounded-lg px-4 py-4 bg-transparent text-white text-sm outline-none mt-5"
        />
        {errors.amount && (
          <p className="text-red-500">
            Amount is required and must be greater than 0.
          </p>
        )}

        <input
          {...register("phoneNumber", {
            required: "This field is required",
            validate: validateInput,
          })}
          type="text"
          placeholder="Recipient's Phone Number or Wallet Address"
          className="border border-[#0795B0] w-full rounded-lg px-2 py-6 bg-transparent text-white text-sm outline-none mt-5"
        />
        {errors.phoneNumber?.message && (
          <p className="text-red-500">{errors.phoneNumber.message}</p>
        )}

        <button
          type="submit"
          className="bg-white font-bold text-lg p-3 rounded-xl w-full mt-5"
        >
          Send
        </button>

        <Dialog open={openConfirmTx} onOpenChange={setOpenConfirmTx}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="mb-[5px]">Confirm Payment</DialogTitle>
              <DialogDescription>
                Confirm Transaction Payment of {amount}{" "}
                {currency === "usdc" ? "USDC" : "KSH"}
              </DialogDescription>
              <DialogDescription>
                With Transaction fee of {transactionFee}
              </DialogDescription>
              <div className="my-3">
                <Player
                  keepLastFrame
                  autoplay
                  loop={true}
                  src={lottieConfirm}
                  style={{ height: "200px", width: "200px" }}
                ></Player>
              </div>

              <button
                type="submit"
                className="font-bold text-lg p-3 rounded-xl w-full mt-5 text-white border-2 bg-blue-500"
                onClick={() => confirmSend()}
              >
                Confirm
              </button>

              <button
                className="bg-red-500 font-bold text-lg p-3 rounded-xl w-full mt-5 text-white"
                onClick={() => setOpenConfirmTx(false)}
              >
                Cancel Payment
              </button>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <TransactionSuccessDialog
          message="Transfer Successful"
          openSuccess={openConfirmingTx}
          setOpenSuccess={setOpenConfirmingTx}
          amount={amount}
          currency={currency}
          transactionCategory={successTx?.transactionCategory as any}
          transactionSubType={successTx?.transactionSubType as any}
          transactionHash={successTx?.hash}
          explorerUrl={successTx?.explorerUrl}
        />
        <ErrorDialog
          message="Transaction Failed"
          openError={openAccErr}
          setOpenError={setOpenAccErr}
        />
      </form>
      <Dialog open={openSuccess} onOpenChange={setOpenSuccess}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="mb-[20px]">
              {finAmount}
              {currency === "usdc" ? " USDC" : " KSH"} Transferred Successfully
            </DialogTitle>
            <Player
              keepLastFrame
              src={lottieSuccess}
              style={{ height: "300px", width: "300px" }}
            ></Player>
            <button
              className="bg-white font-bold text-lg p-3 rounded-xl w-full mt-5 text-black"
              onClick={() => setOpenSuccess(false)}
            >
              Done
            </button>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      </section>
    </AuthGuard>
  );
};

export default Send;
