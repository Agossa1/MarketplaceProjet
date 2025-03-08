import React from 'react';
import Link from 'next/link';

const WishlistSection: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-2">Hi, Bonnie Green</h3>
      <p className="text-gray-400 mb-2">
        So far you have accumulated 5,183 points, to become a Premium user, you need 10,000 points.
      </p>
      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '51.83%' }}></div>
      </div>
      <Link href="#" className="text-blue-400 hover:text-blue-300">
        View premium benefits →
      </Link>
    </div>
  );
};

export default WishlistSection;