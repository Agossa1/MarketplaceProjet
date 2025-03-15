
import { ShopData } from './shops';

// Interface pour les données d'authentification
export interface AuthContextType {
    user: UserData | null;
    accessToken: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
    verifyToken: () => Promise<boolean>;
    refreshToken: () => Promise<boolean>;
    checkAuthStatus: () => Promise<boolean>;
    isAuthInitialized: boolean;
    registerUser: (userData: RegisterData) => Promise<void>;
    createShopLocal: (shopData: FormData) => Promise<ShopData | null>;
    isAuthenticated: boolean;
}




// Interface pour les données d'inscription
export interface RegisterData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    shop?:string
}

//Interface pour les données de l'utilisateur
export interface UserData {
    _id?: string; // Added id for identification after login
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    role?: string[];
    verifiedEmail?: boolean;
    lastLogin?: string;
    accessToken?: string;
    refreshToken?: string;
    shop?: ShopData | null; // Added shop for user's shop after registration'

}

export interface RegisterResponse {
    status: string;
    message?: string;
    data?: {
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: string[];
            verifiedEmail: boolean;
            lastLogin: string;
        };
        accessToken: string;
        refreshToken: string;
    };
    error?: string;
}


export interface LoginResponse {
    status?:string;
    message?: string;
    data?: {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: string[];
            verifiedEmail: boolean;
            lastLogin: string;
        };
    }
    error?: string;
}
// Interface for a token response
export interface TokenResponse {
    message?: string;
    userId?: string;
    accessToken?: string;
    refreshToken?: string;

    accessTokenValid?: boolean;
    refreshTokenValid?: boolean;
    error?: string;
}