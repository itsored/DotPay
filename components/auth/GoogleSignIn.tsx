"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import GoogleButton from "react-google-button";
import GoogleConfigGuide from "./GoogleConfigGuide";

interface GoogleSignInProps {
  mode: "login" | "signup";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ mode, onSuccess, onError }) => {
  const { googleAuth, getGoogleConfig } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<any>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Load Google configuration
    const loadGoogleConfig = async () => {
      try {
        // Check backend status first
        try {
          // Skip backend health check for now since endpoint doesn't exist
          setBackendStatus('online');
          console.log("Backend status: online (skipping health check)");
        } catch (error) {
          console.warn('Backend server is not running:', error);
          setBackendStatus('offline');
        }

        let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        
        // Try to get config from server first, fallback to env variable
        try {
          const config = await getGoogleConfig();
          if (config.data?.clientId) {
            clientId = config.data.clientId;
          }
          setGoogleConfig(config);
        } catch (serverError) {
          console.warn("Server Google config not available, using environment variable");
          if (clientId) {
            setGoogleConfig({ data: { clientId } });
          }
        }

        if (!clientId) {
          throw new Error("No Google Client ID available");
        }
        
        // Load Google Identity Services
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
          if (window.google && clientId) {
            try {
              console.log("Initializing Google Sign-In with Client ID:", clientId);
              console.log("Current domain:", window.location.hostname);
              console.log("Current origin:", window.location.origin);
              
              window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
              });
              
              console.log("Google Sign-In initialized successfully");
              
              // Try to render the button immediately after initialization
              setTimeout(() => {
                try {
                  const buttonElement = document.getElementById('google-signin-button');
                  if (buttonElement && window.google) {
                    window.google.accounts.id.renderButton(buttonElement, { 
                      theme: 'outline', 
                      size: 'large',
                      width: 240,
                      text: mode === 'login' ? 'signin_with' : 'signup_with'
                    });
                    console.log("Google button rendered successfully");
                  }
                } catch (renderError) {
                  console.error("Failed to render Google button:", renderError);
                }
              }, 500);
              
            } catch (initError) {
              console.error("Google Sign-In initialization failed:", initError);
              onError?.("Failed to initialize Google Sign-In. Please check your configuration.");
            }
          }
        };

        script.onerror = () => {
          console.error("Failed to load Google Sign-In script");
          onError?.("Failed to load Google Sign-In. Please check your internet connection.");
        };

        return () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (error) {
        console.error("Failed to load Google config:", error);
        onError?.("Failed to initialize Google Sign-In. Please check configuration.");
      }
    };

    loadGoogleConfig();
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      
      const result = await googleAuth({
        idToken: response.credential,
      });

      if (result) {
        onSuccess?.();
        router.replace("/home");
      }
    } catch (error: any) {
      console.error("Google authentication failed:", error);
      
      // Handle specific network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        onError?.("Backend server is not running. Please ensure the server is started on localhost:8000");
      } else if (error.response?.status === 404) {
        onError?.("Google authentication endpoint not found. Please check backend configuration.");
      } else if (error.response?.status === 500) {
        onError?.("Server error occurred. Please try again later.");
      } else {
        onError?.(error.message || "Google authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };



  if (!googleConfig && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <div className="w-full">
        <div className="bg-gray-300 text-gray-500 p-3 rounded-full text-center font-bold">
          Google Sign-In Unavailable
        </div>
        <p className="text-center text-sm text-gray-400 mt-2">
          Google authentication is not configured
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2 text-xs text-gray-400">
            <summary className="cursor-pointer">Configuration Help</summary>
            <div className="mt-2 p-2 bg-gray-800 rounded text-left">
              <p>To enable Google Sign-In:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Go to Google Cloud Console</li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Add http://localhost:3000 to authorized origins</li>
                <li>Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local</li>
                <li>Ensure backend server is running on localhost:8000</li>
              </ol>
            </div>
          </details>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex flex-col items-center">
        {/* Native Google Sign-In Button */}
        <div id="google-signin-button" className="flex justify-center w-full"></div>
        
        {isLoading && (
          <p className="text-center text-sm text-gray-300 mt-2">
            Authenticating with Google...
          </p>
        )}
        {!googleConfig && !isLoading && (
          <p className="text-center text-sm text-gray-400 mt-2">
            Loading Google Sign-In...
          </p>
        )}
      </div>
      
      <GoogleConfigGuide 
        isOpen={showConfigGuide}
        onClose={() => setShowConfigGuide(false)}
      />
    </>
  );
};

export default GoogleSignIn;