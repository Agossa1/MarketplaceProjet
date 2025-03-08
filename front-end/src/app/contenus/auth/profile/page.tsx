'use client';

import React, { useState, ReactNode } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FiUser, FiMail, FiPhone, FiShoppingBag, FiHeart, FiRefreshCw, FiStar } from 'react-icons/fi';
import OrdersList from '@/app/components/Orders/OrdersList';
import Link from 'next/link';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Logique de mise à jour du profil
    setIsEditing(false);
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: <FiUser /> },
    { id: 'orders', label: 'Commandes', icon: <FiShoppingBag /> },
    { id: 'refunds', label: 'Remboursements', icon: <FiRefreshCw /> },
    { id: 'reviews', label: 'Avis', icon: <FiStar /> },
  ];

  const stats = [
    { label: 'Commandes', value: 145, change: 7, icon: <FiShoppingBag /> },
    { label: 'Avis', value: 26, change: 8.8, icon: <FiStar /> },
    { label: 'Favoris', value: 9, change: -2.5, icon: <FiHeart /> },
    { label: 'Retours', value: 4, change: 5.6, icon: <FiRefreshCw /> },
  ];

  return (
    <div className="container min-w-full px-4 py-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Profil</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="p-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-3xl text-white">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-center mb-2">{user?.fullName}</h2>
                <p className="text-gray-600 text-center mb-4">{user?.email}</p>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  {isEditing ? 'Annuler' : 'Modifier le profil'}
                </button>
              </div>
              <div className="border-t">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`w-full py-3 px-4 text-left ${
                      activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="flex items-center">
                      {tab.icon}
                      <span className="ml-3">{tab.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center mb-2">
                        {stat.icon}
                        <span className="ml-2 text-sm text-gray-600">{stat.label}</span>
                      </div>
                      <div className="text-xl font-semibold">{stat.value}</div>
                      <div className={`text-sm ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
                  <form onSubmit={handleUpdateProfile}>
                    <ProfileField
                      icon={<FiUser />}
                      label="Nom complet"
                      value={user?.fullName}
                      isEditing={isEditing}
                    />
                    <ProfileField
                      icon={<FiMail />}
                      label="Email"
                      value={user?.email}
                      isEditing={isEditing}
                      type="email"
                    />
                    <ProfileField
                      icon={<FiPhone />}
                      label="Téléphone"
                      value={user?.phone}
                      isEditing={isEditing}
                      type="tel"
                    />
                    {isEditing && (
                      <button
                        type="submit"
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md mt-4"
                      >
                        Sauvegarder
                      </button>
                    )}
                  </form>
                </div>

                {/* Nouveau bloc "Gagnez de l'argent avec nous" */}
               <div className="bg-white p-6 rounded-lg shadow mb-6">
  <h3 className="text-xl font-semibold mb-4">Gagnez de l'argent avec nous !</h3>
  <div className="flex items-center justify-between mb-4">
    <div className="flex-1">
      <p className="text-sm text-gray-600 mb-2">
        Vendez vos produits à des millions de clients. Pas de frais de mise en vente par article.
      </p>
    </div>
    <img src="/path/to/your/image.png" alt="Earn money" className="w-24 h-24 object-cover ml-4" />
  </div>
  <Link href="/contenus/shop/Createt-Shop" className="block w-full">
    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out">
      Ouvrir une boutique
    </button>
  </Link>
</div>
              </>
            )}

            {activeTab === 'orders' && <OrdersList />}
            {activeTab === 'refunds' && <p>Contenu des remboursements à implémenter</p>}
            {activeTab === 'reviews' && <p>Contenu des avis à implémenter</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProfileFieldProps {
  icon: ReactNode;
  label: string;
  value: string | undefined;
  isEditing: boolean;
  type?: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ icon, label, value, isEditing, type = 'text' }) => (
  <div className="flex items-center space-x-4 mb-4">
    <div className="text-gray-500">{icon}</div>
    <div className="flex-grow">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {isEditing ? (
        <input
          type={type}
          defaultValue={value}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        />
      ) : (
        <p className="mt-1 text-sm text-gray-900">{value}</p>
      )}
    </div>
  </div>
);

export default ProfilePage;