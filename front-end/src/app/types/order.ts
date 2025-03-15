// Définition de l'interface Order
export interface Order {
    _id: string;
    user: string;
    products: {
        product: string;
        quantity: number;
        price: number;
        discountApplied?: number;
    }[];
    shippingAddress: ShippingAddress; // Type correctement défini
    paymentMethod: string;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    status: string;
}

// Définition de l'interface pour l'adresse de livraison
export interface ShippingAddress {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
    email?: string;
    instructions?: string;
}

// Definition de l'interface de retour
export interface OrderResponse {
    status: string;
    results: number;
    totalOrders: number;
    currentPage: number;
    totalPages: number;
    data: {
        orders: Order[];
    };
    message?: string; // Ajout de la propriété message optionnelle
    error?: string;   // Ajout de la propriété error optionnelle
}