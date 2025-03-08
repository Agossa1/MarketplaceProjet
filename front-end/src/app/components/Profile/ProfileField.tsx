import React from 'react';

const ProfileField: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-2">Earn money with us!</h3>
      <p className="text-gray-400 mb-4">
        Sell your products to hundreds of millions of Flowbite customers. No per-item listing fees.
      </p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Open a shop</button>
    </div>
  );
};

export default ProfileField;