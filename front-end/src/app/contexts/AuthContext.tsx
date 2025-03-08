'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {RegisterResponse, LoginResponse, UserData, RegisterData, AuthContextType } from '../types/user';
import * as authService from '../hooks/authServices';
import { createShop} from "@/app/hooks/useCreateShop";
import { ShopData } from "@/app/types/shops";
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = () => {
            const storedUser = localStorage.getItem('user');
            const storedAccessToken = localStorage.getItem('accessToken');

            if (storedUser) setUser(JSON.parse(storedUser));
            if (storedAccessToken) setAccessToken(storedAccessToken);

            setIsLoading(false);
            setIsAuthInitialized(true);
        };

        if (typeof window !== 'undefined') {
            initializeAuth();
        }
    }, []);
    
    const checkAuthStatus = useCallback(async (): Promise<boolean> => {
        if (accessToken || Cookies.get('refreshToken')) {
            setIsLoading(true);
            setError(null);
            const token = Cookies.get('refreshToken');

            try {
                if (!token) {
                    console.warn('No refresh token available');
                    return false;
                }

                const response: LoginResponse = await authService.refreshToken(token);
                if (response && response.data && response.data.user && response.data.accessToken && response.data.refreshToken) {
                    setUser(response.data.user);
                    setAccessToken(response.data.accessToken);
                    localStorage.setItem('accessToken', response.data.accessToken);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    Cookies.set('refreshToken', response.data.refreshToken, { secure: true, sameSite: 'strict' });
                    return true;
                } else {
                    console.warn('Invalid response from refresh token');
                    return false;
                }
            } catch (err) {
                console.error('Error checking auth status:', err);
                setUser(null);
                setAccessToken(null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                Cookies.remove('refreshToken');
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                return false;
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
            return false;
        }
    }, [accessToken]);

    useEffect(() => {
        if (isAuthInitialized) {
            checkAuthStatus();
        }
    }, [checkAuthStatus, isAuthInitialized]);

   
    
    // Finctions registrations pour l'utilisateur
    const registerUser = useCallback(async (userData: RegisterData): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const response: RegisterResponse = await authService.registerUser(userData);
            if (response.data && response.data.user && response.data.accessToken && response.data.refreshToken) {
                setUser(response.data.user);
                setAccessToken(response.data.accessToken);
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                Cookies.set('refreshToken', response.data.refreshToken, {
                    secure: true,
                    sameSite: 'strict',
                    expires: 7 // expire après 7 jours
                });
                console.log('Redirection vers le profil...');
                router.push('/contenus/auth/profile');
            } else {
                console.error("La réponse ne contient pas le bon format", response);
                throw new Error(response.message || 'Échec de l\'inscription: Données de réponse incomplètes');
            }
        } catch (err: unknown) {
            console.error('Erreur lors de l\'inscription:', err);
            setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue lors de l\'inscription');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

// Fonctions de connexion pour l'utilisateur
   const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
        console.log('Tentative de connexion avec:', { email });
        const response: LoginResponse = await authService.loginUser(email, password);
        console.log('Réponse du serveur:', response);
        
        if (response?.data?.user && response.data.accessToken && response.data.refreshToken) {
            setUser(response.data.user);
            setAccessToken(response.data.accessToken);
            Cookies.set('refreshToken', response.data.refreshToken, { 
                secure: true, 
                sameSite: 'strict',
                expires: 7 // expire après 7 jours
            });
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            console.log('Redirection vers le profil...');
            router.push('/contenus/auth/profile');
        } else {
            console.error("La réponse ne contient pas le bon format", response);
            throw new Error(response.message || 'Échec de la connexion: Données de réponse incomplètes');
        }
    } catch (err: unknown) {
        console.error('Erreur lors de la connexion:', err);
        setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue lors de la connexion');
    } finally {
        setIsLoading(false);
    }
}, [router]);

   /** // Fonction de déconnexion pour l'utilisateur 
    const logoutUser = async () => {
        try {
            const refreshTokenFromCookie = Cookies.get('refreshToken');
            if (accessToken) {
                await authService.logout(accessToken, refreshTokenFromCookie);
            }
        } catch (err) {
            console.error('Error during logout:', err);
        } finally {
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            Cookies.remove('refreshToken');
            router.push('/contenus/auth/login');
        }
    };

    */
   
   
   // Function pour la deconnexion de l'utilisateur
const logoutUser = useCallback(async (): Promise<void> => {
    try {
        const refreshTokenFromCookie = Cookies.get('refreshToken');
        if (accessToken) {
            await authService.logout(accessToken, refreshTokenFromCookie);
        }
    } catch (err) {
        console.error('Error during logout:', err);
    } finally {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        Cookies.remove('refreshToken');
        router.push('/contenus/auth/login');
    }
}, [accessToken, router]);


// Fonction de vérification du token d'authentification
const verifyToken = useCallback(async (): Promise<boolean> => {
    if (!accessToken) {
        console.warn('No access token available');
        return false;
    }

    try {
        const response = await authService.verifyToken(accessToken);
        console.log('Token vérifié avec succès');
        return response.isValid;
    } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        return false;
    }
}, [accessToken]);

// Fonction de rafraîchissement du token d'authentification
const refreshAuthToken = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = Cookies.get('refreshToken');
    if (!refreshTokenValue) {
        console.warn('No refresh token available');
        return false;
    }

    try {
        const response: LoginResponse = await authService.refreshToken(refreshTokenValue);
        if (response && response.data && response.data.accessToken) {
            setAccessToken(response.data.accessToken);
            localStorage.setItem('accessToken', response.data.accessToken);
            if (response.data.refreshToken) {
                Cookies.set('refreshToken', response.data.refreshToken, { secure: true, sameSite: 'strict' });
            }
            console.log('Token rafraîchi avec succès');
            return true;
        } else {
            console.warn('Invalid response from refresh token');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        return false;
    }
}, []);


// Function pour la creation d'une nouvelle boutique
const createShopLocal = useCallback(async (shopData: FormData): Promise<ShopData | null> => {
    setIsLoading(true);
    setError(null);

    if (!accessToken) {
        setError("Token d'accès non disponible. Veuillez vous reconnecter.");
        setIsLoading(false);
        return null;
    }

    try {
        const response: ShopData = await createShop(accessToken, shopData);
        
        // Mise à jour du contexte utilisateur si nécessaire
        if (response && user) {
            const updatedUser = { ...user, shop: response };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Notification de succès
        toast.success("La boutique a été créée avec succès !");
        
        return response;
    } catch (error) {
        console.error('Erreur lors de la création de la boutique:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('token') || error.message.includes('unauthorized')) {
                setError("Votre session a expiré. Veuillez vous reconnecter.");
                // Rediriger vers la page de connexion ou rafraîchir le token
                await refreshAuthToken();
            } else {
                setError(error.message);
            }
        } else {
            setError('Une erreur inconnue est survenue lors de la création de la boutique');
        }

        // Notification d'erreur
        toast.error("Échec de la création de la boutique. Veuillez réessayer.");

        return null;
    } finally {
        setIsLoading(false);
    }
}, [accessToken, user, setUser, refreshAuthToken]);

       // Context de l'authentification
    const contextValue: AuthContextType = {
        user,
        accessToken,
        login,
        logout: logoutUser,
        isLoading,
        error,
        verifyToken,
        refreshToken: refreshAuthToken,
        checkAuthStatus,
        isAuthInitialized,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};