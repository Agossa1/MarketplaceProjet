// Creation d'une boutique
import { ShopData } from "@/app/types/shops";

const API_URL = 'http://localhost:5001/api/shops';

// Interface pour les erreurs de validation
interface ValidationError {
  errors?: string[] | string;
  message?: string;
  status?: number;
}

// Fonction utilitaire pour gérer les réponses HTTP
const handleResponse = async (response: Response) => {
    // Récupérer le texte de la réponse d'abord
    const responseText = await response.text();

    // Essayer de parser le JSON seulement s'il y a du contenu
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
        console.error('Erreur lors du parsing de la réponse JSON:', e);
        console.log('Réponse brute:', responseText);
        throw new Error(`Erreur de format de réponse. Status: ${response.status}`);
    }

    if (!response.ok) {
        console.error(`Requête échouée avec statut: ${response.status} et données:`, data);

        // Gérer les erreurs de validation spécifiques
        if (response.status === 400 && data.errors) {
            const validationError: ValidationError = {
                errors: Array.isArray(data.errors) ? data.errors : [data.message || `Erreur de validation: ${response.status}`],
                message: data.message,
                status: response.status
            };
            throw validationError;
        }

        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
};

// Création d'une boutique par l'utilisateur connecté
export const createShop = async (shopData: FormData, accessToken: string): Promise<ShopData> => {
    // Vérifier que les données minimales requises sont présentes
    if (!shopData.get('name')) {
        return Promise.reject(new Error('Le nom de la boutique est obligatoire'));
    }
    
    if (!shopData.get('categories')) {
        return Promise.reject(new Error('Au moins une catégorie est obligatoire'));
    }

    try {
        // L'email de contact sera automatiquement défini par le backend
        // à partir de l'utilisateur authentifié, donc pas besoin de le vérifier ici

        console.log('FormData being sent:', Array.from(shopData.entries()));

        const response = await fetch(`${API_URL}/create-shop`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
                // Ne pas inclure 'Content-Type' ici, il sera automatiquement défini pour FormData
            },
            body: shopData
        });

        // Récupérer le texte de la réponse d'abord
        const responseText = await response.text();
        
        // Essayer de parser le JSON seulement s'il y a du contenu
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.error('Erreur lors du parsing de la réponse JSON:', e);
            console.log('Réponse brute:', responseText);
            throw new Error(`Erreur de format de réponse. Status: ${response.status}`);
        }

        if (!response.ok) {
            console.error(`Création de boutique échouée avec statut: ${response.status} et données:`, data);
            
            // Gérer les erreurs de validation spécifiques
            if (response.status === 400 && data.errors) {
                throw new Error(Array.isArray(data.errors) 
                    ? data.errors.join(', ') 
                    : data.message || `Erreur de validation: ${response.status}`);
            }
            
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data.shop as ShopData;
    } catch (error) {
        console.error('Error creating shop:', error);
        throw error instanceof Error 
            ? error 
            : new Error('An unknown error occurred while creating the shop');
    }
};

// Get shop by User ID connected
export const getShopByUserId = async (userId: string, accessToken: string): Promise<ShopData | null> => {
    try {
        console.log(`Fetching shop for user ID: ${userId}`);
        console.log(`Using access token: ${accessToken.substring(0, 15)}...`);
        
        const url = `${API_URL}/get-shop-by-user-id/${userId}`;
        console.log(`Making request to: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response: ${errorText}`);
            throw new Error(`Failed to fetch shop: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await handleResponse(response);
        console.log('Shop data received:', responseData);
        
        if (!responseData.shop) {
            console.warn('No shop data found in response');
            return null;
        }
        
        return responseData.shop as ShopData;
    } catch (error) {
        console.error('Error getting shop by user ID:', error);
        // Notification à l'utilisateur pourrait être ajoutée ici
        throw error instanceof Error
            ? error
            : new Error('An unknown error occurred while getting the shop by user ID');
    }
};