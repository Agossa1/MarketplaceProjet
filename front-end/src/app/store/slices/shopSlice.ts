import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ShopData } from "@/app/types/shops";
import { createShop as createShopAPI } from "@/app/hooks/useCreateShop";

interface CreateShopPayload {
  shopData: FormData;
  accessToken: string;
}

export const createShop = createAsyncThunk<ShopData, CreateShopPayload, { rejectValue: string }>(
    'shop/createShop',
    async ({ shopData, accessToken }: CreateShopPayload, { rejectWithValue }) => {
      try {
        const response = await createShopAPI(shopData, accessToken);
        return response;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return rejectWithValue(error.message);
        }
        return rejectWithValue('Une erreur inconnue est survenue');
      }
    }
);

interface ShopState {
  currentShop: ShopData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ShopState = {
  currentShop: null,
  loading: false,
  error: null,
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
          state.error = action.payload ?? 'Une erreur est survenue';
          state.currentShop = null;
        });
  },
});

export default shopSlice.reducer;