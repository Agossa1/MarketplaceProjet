import { OrderResponse, Order } from "@/app/types/order";

const API_URL = 'http://localhost:5001/api/orders';

interface PaginatedOrderResponse extends OrderResponse {
  totalOrders: number;
  currentPage: number;
  totalPages: number;
  results: number;
}

// Récupération des commandes de l'utilisateur avec pagination
export const getOrders = async (
  accessToken: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedOrderResponse> => {
  try {
    const response = await fetch(`${API_URL}/orders/my-orders?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const responseData: PaginatedOrderResponse = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || `HTTP error! status: ${response.status}`);
    }

    return {
      ...responseData,
      totalOrders: responseData.totalOrders,
      currentPage: responseData.currentPage,
      totalPages: responseData.totalPages,
      results: responseData.results,
    };
  } catch (error) {
    console.error('Error while fetching orders:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred while fetching orders');
  }
}

// Création d'une commande
export const createOrder = async (accessToken: string, orderData: Partial<Order>): Promise<OrderResponse> => {
  try {
    const response = await fetch(`${API_URL}/orders/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });
    const responseData: OrderResponse = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    return responseData;
  } catch (error) {
    console.error('Error while creating an order:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred while creating an order');
  }
}

// Récupération d'une commande spécifique
export const getOrderById = async (accessToken: string, orderId: string): Promise<OrderResponse> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const responseData: OrderResponse = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || `HTTP error! status: ${response.status}`);
    }
    return responseData;
  } catch (error) {
    console.error('Error while fetching order:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred while fetching the order');
  }
}

// Mise à jour d'une commande
export const updateOrder = async (accessToken: string, orderId: string, updateData: Partial<Order>): Promise<OrderResponse> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    });
    const responseData: OrderResponse = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || `HTTP error! status: ${response.status}`);
    }
    return responseData;
  } catch (error) {
    console.error('Error while updating order:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred while updating the order');
  }
}

// Suppression d'une commande
export const deleteOrder = async (accessToken: string, orderId: string): Promise<OrderResponse> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const responseData: OrderResponse = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || `HTTP error! status: ${response.status}`);
    }
    return responseData;
  } catch (error) {
    console.error('Error while deleting order:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred while deleting the order');
  }
}