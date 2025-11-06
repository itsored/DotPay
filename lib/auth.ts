import apiClient from './api';

// Types
export interface RegisterInitiateData {
    email: string;
    phoneNumber: string;
    password: string;
    verifyWith: 'email' | 'phone' | 'both';
}

export interface RegisterData {
    email: string;
    phoneNumber: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface LoginData {
    email?: string;
    phoneNumber?: string;
    password: string;
}

export interface VerifyEmailData {
    email: string;
    otp: string;
}

export interface VerifyPhoneData {
    phoneNumber: string;
    otp: string;
}

export interface VerifyLoginData {
    email?: string;
    phoneNumber?: string;
    otp: string;
}

export interface OTPRequestData {
    phoneNumber: string;
}

export interface OTPVerifyData {
    phoneNumber: string;
    otp: string;
}

export interface PasswordResetRequestData {
    email: string;
}

export interface PasswordResetData {
    email: string;
    otp: string;
    newPassword: string;
}

export interface GoogleAuthData {
    idToken: string;
    accessToken?: string;
}

export interface GoogleConfigResponse {
    clientId: string;
    redirectUri: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token?: string;
        arbitrumWallet?: string;
        celoWallet?: string;
        walletAddress?: string;
        email?: string;
        phoneNumber?: string;
        registrationId?: string;
        verificationMethod?: string;
        user?: any;
    };
}

export interface User {
    id?: string; // User ID for business account creation
    email: string;
    phoneNumber: string;
    googleId?: string; // Google account ID
    arbitrumWallet?: string;
    celoWallet?: string;
    walletAddress?: string;
    stellarAccountId?: string; // Stellar wallet address
    token: string;
}

// Authentication API functions
export const authAPI = {
    // Initiate registration
    registerInitiate: async (data: RegisterInitiateData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register/initiate', data);
        return response.data;
    },

    // Complete registration
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    // Verify email during registration
    verifyEmail: async (data: VerifyEmailData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register/verify/email', data);
        return response.data;
    },

    // Verify phone during registration
    verifyPhone: async (data: VerifyPhoneData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register/verify/phone', data);
        return response.data;
    },

    // Login user
    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', data);
        return response.data;
    },

    // Verify login OTP
    verifyLogin: async (data: VerifyLoginData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login/verify', data);
        return response.data;
    },

    // Request OTP (standalone phone authentication)
    requestOTP: async (data: OTPRequestData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/otp', data);
        return response.data;
    },

    // Verify OTP (standalone phone authentication)
    verifyOTP: async (data: OTPVerifyData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/verify-otp', data);
        return response.data;
    },

    // Request password reset
    requestPasswordReset: async (data: PasswordResetRequestData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/password-reset/request', data);
        return response.data;
    },

    // Reset password
    resetPassword: async (data: PasswordResetData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/password-reset', data);
        return response.data;
    },

    // Logout
    logout: async (): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },

    // Google Authentication
    googleAuth: async (data: GoogleAuthData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/google', data);
        return response.data;
    },

    // Link Google Account
    linkGoogle: async (data: GoogleAuthData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/google/link', data);
        return response.data;
    },

    // Get Google Config
    getGoogleConfig: async (): Promise<GoogleConfigResponse> => {
        const response = await apiClient.get('/auth/google-config');
        return response.data;
    },

    // Get user profile (includes user ID)
    getUserProfile: async (): Promise<AuthResponse> => {
        const response = await apiClient.get('/auth/profile');
        return response.data;
    },
    // New: fetch current user with stable id
    getMe: async (): Promise<AuthResponse> => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },
};

// Token management utilities
export const tokenUtils = {
    setToken: (token: string) => {
        localStorage.setItem('nexuspay_token', token);
    },

    getToken: (): string | null => {
        return localStorage.getItem('nexuspay_token');
    },

    removeToken: () => {
        localStorage.removeItem('nexuspay_token');
    },

    isTokenValid: (): boolean => {
        const token = tokenUtils.getToken();
        if (!token) return false;

        try {
            // Basic JWT validation (check if it's not expired)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch {
            return false;
        }
    },
};

// User data management
export const userUtils = {
    setUser: (user: User) => {
        localStorage.setItem('nexuspay_user', JSON.stringify(user));
    },

    getUser: (): User | null => {
        const userData = localStorage.getItem('nexuspay_user');
        return userData ? JSON.parse(userData) : null;
    },

    removeUser: () => {
        localStorage.removeItem('nexuspay_user');
    },

    isAuthenticated: (): boolean => {
        return tokenUtils.isTokenValid() && userUtils.getUser() !== null;
    },
};