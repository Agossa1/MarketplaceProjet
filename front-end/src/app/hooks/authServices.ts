import { RegisterData, RegisterResponse, LoginResponse } from '../types/user';


const API_URL = 'http://localhost:5001/api';

/**
 * Registers a new user.
 * @param userData - The user data to register.
 * @returns A promise that resolves with the RegisterResponse data.
 * @throws An error if the registration fails.
 */
export const registerUser = async (userData: RegisterData): Promise<RegisterResponse> => {
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        const responseData: RegisterResponse = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || responseData.error || `HTTP error! status: ${response.status}`);
        }
        return responseData;
    } catch (error) {
        console.error('Error during user registration:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred while registering the user');
    }
};

/**
 * Logs in a user.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A promise that resolves with the LoginResponse data.
 * @throws An error if the login fails.
 */
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Ajout pour gérer les cookies
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            throw new Error(`Erreur de serveur: impossible de traiter la réponse (${response.status})`);
        }

        if (!response.ok) {
            console.error('Login failed with status:', response.status, 'and data:', data);
            const errorMessage = data && (data.error || data.message) 
                ? data.error || data.message 
                : `Erreur de serveur (${response.status})`;
            throw new Error(errorMessage);
        }

        // Stockage des tokens
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
        }
        
        // Vérification de la structure de la réponse
        if (!data.user) {
            console.error('Invalid response structure:', data);
            throw new Error('Format de réponse invalide du serveur');
        }

        return {
            data: {
                user: data.user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            },
        };
    } catch (error) {
        console.error('Error in loginUser:', error);
        throw error instanceof Error ? error : new Error('Une erreur est survenue lors de la connexion');
    }
};
/**
 * Refreshes the authentication token.
 * @param refreshToken - The refresh token.
 * @returns A promise that resolves with the LoginResponse data.
 * @throws An error if the token refresh fails.
 */
export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
    try {
        if (!refreshToken) {
            throw new Error('Token is missing');
        }
        console.log('Sending refresh token request');
        const response = await fetch(`${API_URL}/users/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        console.log('Refresh token response status:', response.status);

        if (response.status === 401) {
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        console.log('Refresh token response data:', data);
        if (!data.user || !data.accessToken || !data.refreshToken) {
            throw new Error("Réponse du serveur incomplète: certaines informations manquent (user, accessToken ou refreshToken)");
        }
        return {
            data: {
                user: data.user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            },
        };
    } catch (error) {
        console.error('Error during token refresh:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred while refreshing the token');
    }
};

/**
 * Logs out a user.
 * @param accessToken - The access token.
 * @param refreshToken - The refresh token (optional).
 * @returns A promise that resolves with the logout response.
 * @throws An error if the logout fails.
 */
export const logout = async (accessToken: string, refreshToken?: string): Promise<{ success: boolean, message: string }> => {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        };

        if (refreshToken) {
            headers['refreshToken'] = refreshToken;
        }

        const response = await fetch(`${API_URL}/users/logout`, {
            method: 'POST',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error during logout:", error);
        throw error instanceof Error ? error : new Error('An unknown error occurred during logout');
    }
};

/**
 * Verify Token Validity
 * @param accessToken - The access token.
 * @returns A promise that resolves with the verification response.
 * @throws An error if the verification fails.
 */
export const verifyToken = async (accessToken: string): Promise<{ isValid: boolean }> => {
    try {
        const response = await fetch(`${API_URL}/users/verify-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token is invalid or expired
                return { isValid: false };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return { isValid: true };
    } catch (error) {
        console.error("Error verifying token:", error);
        // In case of network errors or other issues, we consider the token invalid
        return { isValid: false };
    }
};
