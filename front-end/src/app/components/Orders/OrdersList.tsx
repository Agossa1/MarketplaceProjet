import React, { useEffect, useState } from 'react';
import { getOrders } from '@/app/hooks/useOrdersServices';
import { Order, OrderResponse } from '@/app/types/order';
import { useAuth } from '@/app/contexts/AuthContext';

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const { accessToken, user } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    const fetchOrders = async (page: number) => {
      if (isAuthenticated && accessToken) {
        try {
          const response: OrderResponse = await getOrders(accessToken, page);
          setOrders(response.data.orders);
          setCurrentPage(response.currentPage);
          setTotalPages(response.totalPages);
        } catch (error) {
          console.error('Échec du chargement des commandes:', error);
        }
      }
    };

    fetchOrders(1);
  }, [isAuthenticated, accessToken]);

  const handlePageChange = (newPage: number) => {
    if (isAuthenticated && accessToken) {
      getOrders(accessToken, newPage).then((response: OrderResponse) => {
        setOrders(response.data.orders);
        setCurrentPage(response.currentPage);
        setTotalPages(response.totalPages);
      }).catch(error => {
        console.error('Échec du chargement des commandes:', error);
      });
    }
  };

  if (!isAuthenticated) {
    return <div>Veuillez vous connecter pour voir vos commandes.</div>;
  }

  return (
    <div>
      <h2>Mes Commandes</h2>
      {orders.length === 0 ? (
        <p>Vous n&apos;avez pas encore de commandes.</p>
      ) : (
        <div>
          {orders.map((order) => (
            <div key={order._id} className="order-item">
              <h3>Commande ID: {order._id}</h3>
              <p>Date: {new Date(order.createdAt).toLocaleString()}</p>
              <p>Total: {order.totalAmount.toFixed(2)} €</p>
              <p>Statut: {order.status}</p>
            </div>
          ))}
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={page === currentPage}
                  className={page === currentPage ? 'active' : ''}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersList;