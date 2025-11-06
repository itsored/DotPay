


// // Home.tsx
// "use client";

// // import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { ARB, UserIcon } from "@/constants/svg";
// import {
//   ArrowCircleDown,
//   BellSimple,
//   CreditCard,
//   List,
//   PaperPlaneTilt,
//   UserCircle,
// } from "@phosphor-icons/react";
// import { useRouter } from "next/navigation";
// import React, { useEffect, useState } from "react";
// // import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { LifeBuoy, LogOut, Settings, User, UserPlus } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Player } from "@lottiefiles/react-lottie-player";
// import loadingJson from "@/public/json/loading.json";
// import { useBalance } from "@/context/BalanceContext";
// 
// const Home = () => {
// //   const { data, isLoading, error } = useBalance();

//   const [openLogoutDialog, setOpenLogoutDialog] = useState(false); // Opens the Logout Loading Dialog
//   const router = useRouter();
//   const {
//     register,
//     handleSubmit,
//     control,
//     formState: { errors },
//   } = useForm();

//   useEffect(() => {
//     // Check if the user is logged in
//     const user = localStorage.getItem("user"); // Assuming 'user' is saved in localStorage on login
//     if (!user) {
//       // If not logged in, redirect to the login page
//       router.replace("/login"); // Adjust the path as needed
//     }
//     console.log(chain)
//   }, [router]);

//   const handleSend = () => {
//     router.replace("/send");
//   };

//   const handleReceive = () => {
//     router.replace("/receive");
//   };

//   const handlePay = () => {
//     router.replace("/pay");
//   };

//   // Logs out the User
//   const handleLogout = () => {
//     setOpenLogoutDialog(true);
//     localStorage.clear();
//     setTimeout(() => {
//       router.replace("/");
//     }, 1000);
//   };

//   return (
//     <section className="home-background">
//       <article className="bg-[#0A0E0E] flex flex-col p-5 xl:px-[200px] border-0 border-b border-[#0795B0]">
//         <div className="flex justify-between">
//           <Sheet>
//             <SheetTrigger>
//               <List size={24} color="#ffffff" />
//             </SheetTrigger>
//             <SheetContent side="left">
//               <SheetHeader>
//                 <ul className="flex flex-col justify-around items-start text-base font-DM text-black w-auto">
//                   <a
//                     href="/reclaim"
//                     className="my-2 mx-2 min-w-[100px] text-black hover:text-aqua hover:cursor-pointer "
//                   >
//                     Home
//                   </a>
//                   <Link href="/reclaim" className="my-2 mx-2 min-w-[100px] text-black hover:text-aqua hover:cursor-pointer ">
//                     Reclaim
//                   </Link>
                  
//                 </ul>
//               </SheetHeader>
//             </SheetContent>
//           </Sheet>

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Image src={UserIcon} alt="tree" />
//             </DropdownMenuTrigger>
//             <DropdownMenuContent className="w-56">
//               <DropdownMenuLabel>My Account</DropdownMenuLabel>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem>
//                 <LogOut className="mr-2 h-4 w-4" />
//                 <span onClick={handleLogout}>Log out</span>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           {/* Dialog to LogOut the User */}
//           <Dialog open={openLogoutDialog} onOpenChange={setOpenLogoutDialog}>
//             <DialogContent className="max-w-lg">
//               <DialogHeader>
//                 <DialogTitle className="mb-[5px]">Logging you out</DialogTitle>
//                 <Player
//                   keepLastFrame
//                   autoplay
//                   loop={true}
//                   src={loadingJson}
//                   style={{ height: "200px", width: "200px" }}
//                 ></Player>
//               </DialogHeader>
//             </DialogContent>
//           </Dialog>
//         </div>
//         <div className="flex flex-col items-center my-[20px]">
//           <Controller
//             name="region"
//             control={control}
//             render={({ field }) => (
//               <Select
//                 defaultValue="ARB"
//                 onValueChange={(value: string) => {
//                   field.onChange(value);
//                   setChain(value); // Update the chain state
//                 }}
//                 value={chain} // Use the chain state
//               >
//                 <SelectTrigger className="w-full my-[20px] p-3">
//                   <SelectValue
//                     defaultValue="Arbitrum One"
//                     placeholder="Select Chain"
//                   />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="arbitrum">Arbitrum</SelectItem>
//                   <SelectItem value="celo">Celo</SelectItem>
//                 </SelectContent>
//               </Select>
//             )}
//           />

//           <h3 className="text-white my-2">Wallet Balance</h3>
//           <h1 className="text-4xl text-white font-bold mb-3 text-center">
//             {isLoading
//               ? "0"
//               : parseFloat(data!.balanceInKES.toString()).toFixed(2)}{" "}
//             KES
//           </h1>
//           <h1 className="text-xl text-white font-bold mb-3 text-center">
//             {isLoading
//               ? 0
//               : parseFloat(data!.balanceInUSDC.toString()).toFixed(2)}{" "}
//             USDC
//           </h1>
//           <p className="text-sm mt-2 text-white">
//             {/* Current Rate: 1 USDC = {balance.rate} KES */}
//             Current Rate: 1 USDC ={" "}
//             {isLoading ? 0 : parseFloat(data!.rate.toString()).toFixed(2)} KES
//           </p>
//         </div>
//         <div className="flex justify-around relative top-20 ">
//           <div className="flex flex-col items-center" onClick={handleSend}>
//             <span className="border border-[#0795B0] rounded-full p-4 bg-[#0A0E0E] hover:bg-white text-white hover:text-[#0795B0] hover:cursor-pointer hover:border-white">
//               <PaperPlaneTilt size={24} weight="fill" />
//             </span>
//             <h4 className="text-white my-1">Send</h4>
//           </div>
//           <div className="flex flex-col items-center" onClick={handleReceive}>
//             <span className="border border-[#0795B0] rounded-full p-4 bg-[#0A0E0E] hover:bg-white text-white hover:text-[#0795B0] hover:cursor-pointer hover:border-white">
//               <ArrowCircleDown size={24} weight="fill" />
//             </span>
//             <h4 className="text-white my-1">Receive</h4>
//           </div>
//           <div className="flex flex-col items-center" onClick={handlePay}>
//             <span className="border border-[#0795B0] rounded-full p-4 bg-[#0A0E0E] hover:bg-white text-white hover:text-[#0795B0] hover:cursor-pointer hover:border-white">
//               <CreditCard size={24} weight="fill" />
//             </span>
//             <h4 className="text-white my-1">Pay</h4>
//           </div>
//         </div>
//       </article>
//       <article className="mt-20 flex flex-col items-center p-5  xl:px-[200px]">
//         <div className="flex flex-col justify-around rounded-xl w-full overflow-hidden bg-wallet-bg bg-cover p-5 h-[180px]">
//           <h3 className="text-white text-xl my-1 font-semibold">
//             Buy Crypto Assets, Tokens Securely.
//           </h3>
//           <button className="bg-white font-bold text-lg p-3 rounded-xl w-[150px]">
//             Buy Crypto
//           </button>
//         </div>
//       </article>
//       <Transactions />
//     </section>
//   );
// };

// export default Home;




// Home.tsx
"use client";

import { UserIcon } from "@/constants/svg";
import {
  ArrowCircleDown,
  BellSimple,
  CreditCard,
  List,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, UserPlus, Copy, Eye, EyeOff, Smartphone, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import loadingJson from "@/public/json/loading.json";

// Dynamically import Player to avoid SSR issues
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useOptimizedBalance } from "@/hooks/useOptimizedBalance";
import { BalanceSkeleton, BalanceErrorState, BalanceEmptyState } from "@/components/ui/balance-skeleton";
import { RecentTransactions } from "@/components/transactions/RecentTransactions";
import { cryptoConverter } from "@/lib/crypto-converter";
import { BusinessList } from "@/components/business/BusinessList";

const Home = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    currentBusiness, 
    isPinVerified, 
    switchToBusiness, 
    verifyBusinessPin,
    setBusinessPin,
    businessAccounts,
    loadBusinessAccounts
  } = useBusiness();
  const { balance, chainBalance, loading, error, fetchAllBalances, fetchChainBalance } = useOptimizedBalance();

  const [openLogoutDialog, setOpenLogoutDialog] = useState(false); // Opens the Logout Loading Dialog
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated using the auth context
    if (!isAuthenticated) {
      // If not logged in, redirect to the login page
      router.replace("/login");
    }
    console.log("User:", user);
    console.log("Business accounts:", businessAccounts);
    console.log("Current business:", currentBusiness);
  }, [router, isAuthenticated, user, businessAccounts, currentBusiness]);

  const handleSend = () => {
    router.replace("/crypto");
  };

  const handleReceive = () => {
    router.replace("/receive");
  };

  const handlePay = () => {
    router.replace("/pay");
  };

  const handleBuy = () => {
    router.replace("/buy-crypto");
  };

  // Logs out the User
  const handleLogout = () => {
    setOpenLogoutDialog(true);
    logout();
    setTimeout(() => {
      router.replace("/");
    }, 1000);
  };

  // Handle settings click
  const handleSettings = () => {
    router.push("/settings");
  };

  // Handle business account selection
  const handleBusinessSelect = (businessId: string) => {
    console.log('Business selected:', businessId);
    // The BusinessList component handles PIN verification internally
  };

  // Handle chain selection
  const handleChainChange = (chain: string) => {
    setSelectedChain(chain);
    if (chain === 'all') {
      fetchAllBalances();
    } else {
      fetchChainBalance(chain);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    if (selectedChain === 'all') {
      fetchAllBalances(true); // Force refresh
    } else {
      fetchChainBalance(selectedChain, true); // Force refresh
    }
  };

  // Get current balance data based on selection
  const getCurrentBalance = () => {
    if (selectedChain === 'all') {
      return balance;
    } else {
      return chainBalance;
    }
  };

  // Get total USD value
  const getTotalUSDValue = () => {
    const currentBalance = getCurrentBalance();
    return currentBalance?.totalUSDValue || 0;
  };

  // Get chain-specific balances
  const getChainBalances = () => {
    const currentBalance = getCurrentBalance();
    if (selectedChain === 'all') {
      return currentBalance?.balances || {};
    } else {
      return currentBalance?.balances ? { [selectedChain]: currentBalance.balances } : {};
    }
  };

  // Dynamic USD→KES rate
  const [usdToKesRate, setUsdToKesRate] = useState<number>(130);

  useEffect(() => {
    const loadRate = async () => {
      try {
        const rates = await cryptoConverter.getConversionRates();
        // rates.kes is USD→KES divisor per existing usage; 1 USD = (1 / rates.kes) KES
        const computed = 1 / rates.kes;
        if (isFinite(computed) && computed > 0) setUsdToKesRate(computed);
      } catch {
        // keep default fallback
      }
    };
    loadRate();
  }, []);

  const getKESEquivalent = () => {
    const usdAmount = getTotalUSDValue();
    return usdAmount * usdToKesRate;
  };


  return (
    <section className="home-background">
      <article className="bg-[#0A0E0E] flex flex-col p-5 xl:px-[200px] border-0 border-b border-[#0795B0]">
        <div className="flex justify-between">
          <Sheet>
            <SheetTrigger>
              <List size={24} color="#ffffff" />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <ul className="flex flex-col justify-around items-start text-base font-DM text-black w-auto">
                  <Link
                    href="/home"
                    className="my-2 mx-2 min-w-[100px] text-black hover:text-aqua hover:cursor-pointer "
                  >
                    Home
                  </Link>
                  <Link
                    href="/business"
                    className="my-2 mx-2 min-w-[100px] text-black hover:text-aqua hover:cursor-pointer "
                  >
                    Business
                  </Link>
                  <Link
                    href="/reclaim"
                    className="my-2 mx-2 min-w-[100px] text-black hover:text-aqua hover:cursor-pointer "
                  >
                    Reclaim
                  </Link>
                </ul>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Image 
                src={UserIcon} 
                alt="tree" 
                onClick={() => {
                  // Load business accounts when user opens dropdown
                  if (user?.id && businessAccounts.length === 0) {
                    loadBusinessAccounts();
                  }
                }}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Settings */}
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              {/* Business Account Switcher */}
              {currentBusiness ? (
                <DropdownMenuItem 
                  onClick={() => {
                    console.log('Switch to Business clicked');
                    router.push('/business/home');
                  }}
                  className="hover:bg-blue-50"
                >
                  <UserPlus className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">Switch to {currentBusiness.businessName}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => {
                    console.log('Browse Business Accounts clicked');
                    router.push('/business');
                  }}
                  className="hover:bg-blue-50"
                >
                  <UserPlus className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">Business Accounts</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Logout */}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dialog to LogOut the User */}
          <Dialog open={openLogoutDialog} onOpenChange={setOpenLogoutDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="mb-[5px]">Logging you out</DialogTitle>
                <Player
                  keepLastFrame
                  autoplay
                  loop={true}
                  src={loadingJson}
                  style={{ height: "200px", width: "200px" }}
                ></Player>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-col items-center my-[20px]">
          {/* Chain Selector */}
          <div className="w-full max-w-md mb-4">
            <Select value={selectedChain} onValueChange={handleChainChange}>
              <SelectTrigger className="w-full my-[20px] p-3">
                <SelectValue placeholder="Select Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="arbitrum">Arbitrum</SelectItem>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="celo">Celo</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="optimism">Optimism</SelectItem>
                <SelectItem value="avalanche">Avalanche</SelectItem>
                <SelectItem value="bnb">BNB Chain</SelectItem>
                <SelectItem value="scroll">Scroll</SelectItem>
                <SelectItem value="gnosis">Gnosis</SelectItem>
                <SelectItem value="stellar">🌟 Stellar (NEW)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="text-white">
              {currentBusiness ? `${currentBusiness.businessName} Balance` : 'Wallet Balance'}
            </h3>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
              title="Refresh balance"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* Current Account Indicator */}
          {currentBusiness && (
            <div className="mb-4 p-2 bg-[#0795B0]/20 border border-[#0795B0] rounded-lg">
              <p className="text-sm text-[#0795B0] text-center">
                🏢 Business Account: {currentBusiness.businessName} ({currentBusiness.merchantId})
                {!isPinVerified && <span className="ml-2 text-yellow-400">⚠️ PIN Required</span>}
              </p>
            </div>
          )}
          
          {loading && !getCurrentBalance() ? (
            <BalanceSkeleton />
          ) : error && !getCurrentBalance() ? (
            <BalanceErrorState 
              error={error} 
              onRetry={() => selectedChain === 'all' ? fetchAllBalances(true) : fetchChainBalance(selectedChain, true)} 
            />
          ) : getCurrentBalance() ? (
            <>
              {/* KES Equivalent (Primary Display) */}
              <h1 className="text-4xl text-white font-bold mb-3 text-center">
                {getKESEquivalent().toFixed(2)} KES
              </h1>
              
              {/* USD Value */}
              <h1 className="text-xl text-white font-bold mb-3 text-center">
                ${getTotalUSDValue().toFixed(2)} USD
              </h1>
              
              {/* Exchange Rate */}
              <p className="text-sm mt-2 text-white">
                Current Rate: 1 USD = {usdToKesRate.toFixed(2)} KES
              </p>
              
              {/* Chain-specific balances */}
              <div className="text-center w-full max-w-md">
                {Object.entries(getChainBalances()).map(([chain, tokens]) => (
                  <div key={chain} className="mb-4">
                    <h2 className="text-lg text-gray-300 mb-2 capitalize">
                      {chain === 'all' ? 'All Chains' : chain}
                    </h2>
                    {Object.entries(tokens).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(tokens).map(([token, amount]) => (
                          <p key={token} className="text-sm text-gray-300">
                            {Number(amount).toFixed(6)} {token}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No tokens found</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <BalanceEmptyState />
          )}
        </div>
        <div className="flex justify-around relative top-20 ">
          <div className="flex flex-col items-center" onClick={handleSend}>
            <span className="border border-[#0795B0] rounded-full p-4 bg-[#0A0E0E] hover:bg-white text-white hover:text-[#0795B0] hover:cursor-pointer hover:border-white">
              <PaperPlaneTilt size={24} weight="fill" />
            </span>
            <h4 className="text-white my-1">Send</h4>
          </div>
          <div className="flex flex-col items-center" onClick={handleReceive}>
            <span className="border border-[#0795B0] rounded-full p-4 bg-[#0A0E0E] hover:bg-white text-white hover:text-[#0795B0] hover:cursor-pointer hover:border-white">
              <ArrowCircleDown size={24} weight="fill" />
            </span>
            <h4 className="text-white my-1">Receive</h4>
          </div>
          <div className="flex flex-col items-center" onClick={handlePay}>
            <span className="border border-[#0795B0] rounded-full p-4 bg-[#0A0E0E] hover:bg-white text-white hover:text-[#0795B0] hover:cursor-pointer hover:border-white">
              <CreditCard size={24} weight="fill" />
            </span>
            <h4 className="text-white my-1">Pay</h4>
          </div>
        </div>
      </article>
      <article className="mt-20 flex flex-col items-center p-5  xl:px-[200px]">
        <div className="flex flex-col justify-around rounded-xl w-full overflow-hidden bg-wallet-bg bg-cover p-5 h-[180px]">
          <h3 className="text-white text-xl my-1 font-semibold">
            Buy Crypto Assets, Tokens Securely.
          </h3>
          <button 
            className="bg-white font-bold text-lg p-3 rounded-xl w-[150px] hover:bg-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer" 
            onClick={handleBuy}
          >
            Buy Crypto
          </button>
        </div>
      </article>

      {/* Recent Transactions Section */}
      <article className="mt-8 flex flex-col items-center p-5 xl:px-[200px]">
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
            <Link 
              href="/transactions"
              className="text-[#0795B0] hover:text-[#0AA5C0] text-sm font-medium transition-colors duration-200"
            >
              View All →
            </Link>
          </div>
          
          <div className="bg-[#0A0E0E] rounded-xl border border-[#0795B0] p-6">
            <RecentTransactions showDebug={false} />
          </div>
        </div>
      </article>

    </section>
  );
};

export default Home;
