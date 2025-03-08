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
    shippingAddress: any; // À définir plus précisément
    paymentMethod: string;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    status: string;
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