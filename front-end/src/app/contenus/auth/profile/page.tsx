'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FiUser, FiMail, FiPhone, FiShoppingBag, FiHeart, FiRefreshCw, FiStar } from 'react-icons/fi';
import OrdersList from '@/app/components/Orders/OrdersList';
import Link from 'next/link';
import { fetchUserShop } from '@/app/store/slices/shopSlice';
import { AppDispatch, RootState } from "@/app/store/store";
import { useDispatch, useSelector } from "react-redux";
import Image from 'next/image';


// Définition du composant ProfileField
interface ProfileFieldProps {
  icon: ReactNode;
  label: string;
  value?: string;
  isEditing: boolean;
  type?: string;
}

const ProfileField = ({ icon, label, value, isEditing, type = 'text' }: ProfileFieldProps) => (
  <div className="mb-4">
    <div className="flex items-center mb-1">
      <span className="text-gray-500 mr-2">{icon}</span>
      <label className="text-sm text-gray-600">{label}</label>
    </div>
    {isEditing ? (
      <input
        type={type}
        defaultValue={value}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    ) : (
      <div className="text-gray-800">{value || 'Non spécifié'}</div>
    )}
  </div>
);

const ProfilePage = () => {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { userShop, loading, error } = useSelector((state: RootState) => state.shop);

  useEffect(() => {
    if (user?._id && accessToken) {
      dispatch(fetchUserShop({ userId: user._id, accessToken }));
    }
  }, [dispatch, user, accessToken]);

  // Suppression de la variable userData non utilisée
  useEffect(() => {
    if (userShop) {
      console.log('Données de la boutique chargées:', userShop);
    }
  }, [userShop]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Implémentation de la mise à jour du profil
    setIsEditing(false);
  };

  // Données fictives pour les statistiques
  const stats = [
    { label: 'Commandes', value: '12', change: 5, icon: <FiShoppingBag className="text-blue-500" /> },
    { label: 'Favoris', value: '24', change: -2, icon: <FiHeart className="text-red-500" /> },
    { label: 'Retours', value: '1', change: 0, icon: <FiRefreshCw className="text-orange-500" /> },
    { label: 'Avis', value: '8', change: 10, icon: <FiStar className="text-yellow-500" /> },
  ];

  // Onglets du profil
  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <FiUser /> },
    { id: 'orders', label: 'Commandes', icon: <FiShoppingBag /> },
    { id: 'refunds', label: 'Remboursements', icon: <FiRefreshCw /> },
    { id: 'reviews', label: 'Avis', icon: <FiStar /> },
  ];
  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-1/4">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 bg-blue-600 text-white">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-white text-blue-600 flex items-center justify-center text-2xl font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold">{user?.fullName || 'Utilisateur'}</h2>
                    <p className="text-blue-100">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="mt-4 w-full bg-white text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 transition"
                >
                  {isEditing ? 'Annuler' : 'Modifier le profil'}
                </button>
              </div>
              <div className="divide-y divide-gray-200">
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
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                      >
                        Enregistrer les modifications
                      </button>
                    )}
                  </form>
                </div>
                {/* Section Boutique */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h2 className="text-xl font-semibold mb-4">Ma Boutique</h2>
                  {loading ? (
                    <p>Chargement des informations de la boutique...</p>
                  ) : error ? (
                    <p className="text-red-500">Erreur: {error}</p>
                  ) : userShop ? (
                  <div>
  <div className="flex items-center mb-4">
    {userShop.shopLogo && typeof userShop.shopLogo === 'object' && 'url' in userShop.shopLogo ? (
      <Image
        src={userShop.shopLogo.url as string}
        alt={userShop.name || 'Boutique'}
        width={80}
        height={80}
        className="rounded-lg mr-4"
      />
    ) : (
      <div className="w-20 h-20 bg-gray-200 rounded-lg mr-4 flex items-center justify-center">
        <FiShoppingBag className="text-gray-400 text-2xl" />
      </div>
    )}
    <div>
      <h3 className="text-lg font-medium">{userShop.name}</h3>
      <p className="text-gray-600">{userShop.description ? `${userShop.description.substring(0, 100)}...` : "Non spécifié"}</p>
    </div>
  </div>
  <Link href={`/contenus/shop/${userShop._id}`}>
    <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
      Gérer ma boutique
    </button>
  </Link>
</div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="mb-4 mx-auto w-40 h-40 relative">
                        {/* Remplacer par une image locale pour éviter l'erreur */}
                        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                          <FiShoppingBag className="text-gray-400 text-4xl" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium mb-2">Vous n&apos;avez pas encore de boutique</h3>
                      <p className="text-gray-600 mb-4">Créez votre boutique et commencez à vendre vos produits dès aujourd&apos;hui!</p>
                                           <Link href="/contenus/shop/Create-Shop">
                        <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                          Créer ma boutique
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Mes Commandes</h2>
                <OrdersList />
              </div>
            )}

            {activeTab === 'refunds' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Mes Remboursements</h2>
                <p className="text-gray-600">Vous n&apos;avez pas encore de demandes de remboursement.</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Mes Avis</h2>
                <p className="text-gray-600">Vous n&apos;avez pas encore laissé d&apos;avis sur des produits.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;