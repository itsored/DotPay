import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/style.css";
import { AuthProvider } from "@/context/AuthContext"; // Ensure this path matches the location of your AuthContext file
import { BalanceProvider } from "@/context/BalanceContext";
import { ChainProvider } from "@/context/ChainContext";
import { WalletProvider } from "@/context/WalletContext";
import { PWAProvider } from "@/context/PWAContext";
import { BusinessProvider } from "@/context/BusinessContext";
import ClientOnly from "./ClientOnly";
import { ReactQueryClientProvider } from "@/providers/ReactQueryClientProvider";
import { Toaster } from "react-hot-toast";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import PWAUpdateNotification from "@/components/pwa/PWAUpdateNotification";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "NexusPay",
  title: {
    default: "NexusPay - Stablecoin Wallet",
    template: "NexusPay - %s",
  },
  metadataBase: new URL("https://app.nexuspaydefi.xyz"),
  description: "Secure stablecoin payment wallet for fast, low-cost transactions. Send, receive, and manage your digital assets with ease.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NexusPay",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "NexusPay",
    title: {
      default: "NexusPay - Stablecoin Wallet",
      template: "NexusPay - %s",
    },
    description: "Secure stablecoin payment wallet for fast, low-cost transactions",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "NexusPay Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "NexusPay - Stablecoin Wallet",
      template: "NexusPay - %s",
    },
    description: "Secure stablecoin payment wallet for fast, low-cost transactions",
    images: ["/icons/icon-512x512.png"],
  },
  keywords: ["stablecoin", "crypto", "wallet", "payments", "defi", "blockchain"],
  authors: [{ name: "NexusPay Team" }],
  creator: "NexusPay",
  publisher: "NexusPay",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};



export const viewport: Viewport = {
  themeColor: "#0795B0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <meta name="application-name" content="NexusPay" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NexusPay" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0795B0" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0795B0" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#0795B0" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://app.nexuspaydefi.xyz" />
        <meta name="twitter:title" content="NexusPay - Stablecoin Wallet" />
        <meta name="twitter:description" content="Secure stablecoin payment wallet for fast, low-cost transactions" />
        <meta name="twitter:image" content="https://app.nexuspaydefi.xyz/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@nexuspay" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="NexusPay - Stablecoin Wallet" />
        <meta property="og:description" content="Secure stablecoin payment wallet for fast, low-cost transactions" />
        <meta property="og:site_name" content="NexusPay" />
        <meta property="og:url" content="https://app.nexuspaydefi.xyz" />
        <meta property="og:image" content="https://app.nexuspaydefi.xyz/icons/icon-512x512.png" />
      </head>
      <body className={inter.className}>
        {/* Suppress console logs in production */}
        {process.env.NODE_ENV === 'production' && (
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              var safe = function(){};
              var methods = ['log','debug','info','warn','error'];
              methods.forEach(function(m){try{console[m]=safe;}catch(e){}});
              // Disable React devtools hook exposure if present
              try{ if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                for (const k in window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                  window.__REACT_DEVTOOLS_GLOBAL_HOOK__[k] = typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__[k] === 'function' ? function(){} : null;
                }
              }}catch(e){}
            })();
          ` }} />
        )}
        <ReactQueryClientProvider>
          <PWAProvider>
            <AuthProvider>
              <BusinessProvider>
                <WalletProvider>
                  <ChainProvider>
                    <BalanceProvider>
                      <ClientOnly>{children}</ClientOnly>
                      <PWAInstallPrompt />
                      <PWAUpdateNotification />
                      <Toaster />
                    </BalanceProvider>
                  </ChainProvider>
                </WalletProvider>
              </BusinessProvider>
            </AuthProvider>
          </PWAProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}
