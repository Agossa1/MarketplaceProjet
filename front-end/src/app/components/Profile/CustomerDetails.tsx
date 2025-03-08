import React from 'react';

const CustomerDetails: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-6">
      <h2 className="text-2xl font-bold mb-4">Customer details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400">Name</p>
          <p>Joseph McFall</p>
        </div>
        <div>
          <p className="text-gray-400">Email</p>
          <p>name@example.com</p>
        </div>
        <div>
          <p className="text-gray-400">Phone</p>
          <p>+123 456 7890</p>
        </div>
        <div>
          <p className="text-gray-400">Country</p>
          <p>🇺🇸 United States</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-gray-400">Address</p>
          <p>62 Miles Drive St, Newark, NJ 07103, California</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;