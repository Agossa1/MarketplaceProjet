// Creation d'une boutique
import { ShopData } from "@/app/types/shops";

const API_URL = 'http://localhost:5001/api/shops';

// Création d'une boutique par l'utilisateur connecté
export const createShop = async (shopData: FormData, accessToken: string): Promise<any> => {
    try {
        console.log('FormData being sent:', Array.from(shopData.entries()));

        const response = await fetch(`${API_URL}/create-shop`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
                // Ne pas inclure 'Content-Type' ici, il sera automatiquement défini pour FormData
            },
            body: shopData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating shop:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred while creating the shop');
    }
};