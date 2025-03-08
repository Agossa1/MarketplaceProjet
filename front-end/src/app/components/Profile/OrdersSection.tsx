import React from 'react';

const OrdersSection: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Delivery details</h2>
      <div>
        <p className="text-gray-400">Pick-up point</p>
        <p>Herald Square, 2, New York, United States of America</p>
      </div>
    </div>
  );
};

export default OrdersSection;