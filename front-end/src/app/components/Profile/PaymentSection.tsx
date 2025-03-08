import React from 'react';

const PaymentSection: React.FC = () => {
  return (
    <div className="flex space-x-2 mb-6">
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Overview</button>
      <button className="bg-gray-700 text-white px-4 py-2 rounded">My orders</button>
      <button className="bg-gray-700 text-white px-4 py-2 rounded">My refunds</button>
      <button className="bg-gray-700 text-white px-4 py-2 rounded">My reviews</button>
    </div>
  );
};

export default PaymentSection;