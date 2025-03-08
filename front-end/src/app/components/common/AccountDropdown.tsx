'use client';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { IconType } from 'react-icons';
import {
  FaUser,
  FaShoppingCart,
  FaCog,
  FaFileAlt,
  FaQuestionCircle,
  FaSignInAlt,
  FaShieldAlt,
  FaSignOutAlt,
  FaUserPlus,
  FaChartBar,
  FaHeart,
  FaWallet,
  FaStar,
  FaGift,
  FaHeadset,
  FaExchangeAlt,
  FaCommentAlt,
  FaCheckCircle,
  FaFileInvoiceDollar,
  FaCalendarAlt,
} from 'react-icons/fa';

interface AccountDropdownProps {
  isOpen: boolean;
}

interface DropdownItemData {
  href?: string;
  label: string;
  icon: IconType;
  authRequired?: boolean;
  onClick?: () => void;
}

const DropdownItem: React.FC<{ item: DropdownItemData }> = ({ item }) => {
  if (item.onClick) {
    return (
      <button
        onClick={item.onClick}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
      >
        <item.icon className="w-5 h-5 mr-3 text-gray-500" />
        {item.label}
      </button>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
    >
      <item.icon className="w-5 h-5 mr-3 text-gray-500" />
      {item.label}
    </Link>
  );
};

const AccountDropdown: React.FC<AccountDropdownProps> = ({ isOpen }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
  };

  const loggedInItems: DropdownItemData[] = [
    { href: '/contenus/auth/profile', label: 'My Account', icon: FaUser },
    { href: '/orders', label: 'My Orders', icon: FaShoppingCart },
    { href: '/wallet', label: 'My Wallet', icon: FaWallet },
    { href: '/favorites', label: 'Favourite Items', icon: FaHeart },
    { href: '/vouchers', label: 'Vouchers and gift cards', icon: FaGift },
    { href: '/service', label: 'Service', icon: FaHeadset },
    { href: '/returns', label: 'My Returns', icon: FaExchangeAlt },
    { href: '/reviews', label: 'My Reviews', icon: FaCommentAlt },
    { href: '/guarantees', label: 'My Guarantees', icon: FaCheckCircle },
    { href: '/billing', label: 'Billing Data', icon: FaFileInvoiceDollar },
    { href: '/subscriptions', label: 'Plans & Subscriptions', icon: FaCalendarAlt },
    { label: 'Log out', icon: FaSignOutAlt, onClick: handleLogout },
  ];

  const loggedOutItems: DropdownItemData[] = [
    { href: '/contenus/auth/login', label: 'Log in', icon: FaSignInAlt },
    { href: '/contenus/auth/register', label: "Sign up", icon: FaUserPlus },
  ];

  const itemsToRender = user ? loggedInItems : loggedOutItems;

  return (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border text-black border-gray-200">
      {user && (
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      )}
      <div className="py-1">
        {itemsToRender.map((item, index) => (
          <div key={item.href || index}>
            <DropdownItem item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountDropdown;