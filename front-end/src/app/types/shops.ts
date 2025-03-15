// Interface pour les données de la boutique
export interface ShopData {
    _id?: string;
    name?: string;
    description?: string;
    categories?: string[];
    contactEmail?: string;
    contactPhone?: string;
    shopLogo?: File | null;
    coverImage?: File | null;
    images?: File[];
    logo?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    openingHours?: {
        [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']?: {
            open: string;
            close: string;
        };
    };
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    id?: string;
    products?: Array<{
        productId: string;
        name: string;
        category: string;
        subcategory: string;
        price: number;
    }>;
    ordersHistory?: Array<{
        orderId: string;
    }>;
    owner?: {
        id: string;
        username: string;
    };
    reviews?: Array<{
        reviewId: string;
    }>;
    averageRating?: number;
    totalRatings?: number;
    status?: string;
    subcategories?: string[];
    tags?: string[];
    followers?: Array<{
        userId: string;
    }>;
    slug?: string;
}
export interface ShopResponse {
    message: string;
    data?: {
        shop: ShopData;
    };
}

