import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  change: number;
}

const ProfileCard: React.FC<StatCardProps> = ({ title, value, change }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-gray-400 mb-2">{title}</h3>
      <p className="text-2xl font-bold mb-2">{value}</p>
      <p className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
      </p>
    </div>
  );
};

export default ProfileCard;