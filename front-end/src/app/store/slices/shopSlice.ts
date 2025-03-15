import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ShopData } from "@/app/types/shops";
import { createShop as createShopAPI, getShopByUserId } from "@/app/hooks/useCreateShop";
import { refreshToken } from '@/app/hooks/authServices';

interface CreateShopPayload {
  shopData: FormData;
  accessToken: string;
  refreshToken?: string;
}

// Interface pour typer la réponse du refreshToken
interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

// Interface pour les erreurs HTTP
interface HttpError {
  status: number;
  data?: {
    message?: string;
    errors?: string[];
  };
  message?: string;
}

export const createShop = createAsyncThunk<ShopData, CreateShopPayload, { rejectValue: string }>(
    'shop/createShop',
    async ({ shopData, accessToken, refreshToken: userRefreshToken }: CreateShopPayload, { rejectWithValue }) => {
      try {
        // Tentative de création de la boutique avec le token actuel
        try {
          return await createShopAPI(shopData, accessToken);
        } catch (error: unknown) {
          // Typage de l'erreur pour accéder à ses propriétés de manière sûre
          const err = error as Partial<HttpError>;
          
          // Si l'erreur est due à un token expiré (401) et qu'un refreshToken est disponible
          if (err.status === 401 && userRefreshToken) {
            // Tenter de rafraîchir le token
            const newTokens = await refreshToken(userRefreshToken) as TokenResponse;
            
            // Vérifier si newTokens est valide et contient un accessToken
            if (newTokens && typeof newTokens === 'object' && 'accessToken' in newTokens) {
              // Réessayer avec le nouveau token
              return await createShopAPI(shopData, newTokens.accessToken);
            }
          }
          // Si ce n'est pas un problème de token ou si le rafraîchissement a échoué, propager l'erreur
          return rejectWithValue(err.message || 'Erreur lors de la création de la boutique');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          return rejectWithValue(error.message);
        }

   // Pour les erreurs HTTP avec status et data
if (typeof error === 'object' && error !== null && 'status' in error) {
  const httpError = error as HttpError;
  const errorMessage = httpError.message || 
                      (httpError.data && typeof httpError.data === 'object' && 'message' in httpError.data 
                       ? httpError.data.message 
                       : `Erreur ${httpError.status}`);
  // Assurez-vous que errorMessage est toujours une chaîne de caractères
  return rejectWithValue(errorMessage || 'Erreur inconnue');
}
        return rejectWithValue('Une erreur inconnue est survenue');
      }
    }
);

// Thunk pour recuperer la boutique par ID utilisateur
export const fetchUserShop = createAsyncThunk(
  'shop/fetchUserShop',
  async ({ userId, accessToken }: { userId: string, accessToken: string }, { rejectWithValue }) => {
    try {
      const shop = await getShopByUserId(userId, accessToken);
      return shop;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  }
);

interface ShopState {
  currentShop: ShopData | null;
  userShop: ShopData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ShopState = {
  currentShop: null,
  userShop: null,
  loading: false,
  error: null,
};

// Slice
const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    clearShopError: (state) => {
      state.error = null;
    },
    resetShopState: () => initialState
  },
  extraReducers: (builder) => {
    builder
        // Gestion de createShop
        .addCase(createShop.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createShop.fulfilled, (state, action: PayloadAction<ShopData>) => {
          state.loading = false;
          state.currentShop = action.payload;
          state.error = null;
        })
        .addCase(createShop.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload ?? 'Une erreur est survenue lors de la création de la boutique';
          state.currentShop = null;
        })
        // Gestion de fetchUserShop
        .addCase(fetchUserShop.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchUserShop.fulfilled, (state, action: PayloadAction<ShopData | null>) => {
          state.loading = false;
          state.userShop = action.payload;
        })
        .addCase(fetchUserShop.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
  }
});

export const { clearShopError, resetShopState } = shopSlice.actions;
export default shopSlice.reducer;