import React, { useState, useRef, useEffect } from 'react';
import AccountDropdown from './AccountDropdown';
import { useAuth } from '../../contexts/AuthContext';

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn } = useAuth();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (label === "Compte") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          className="text-white hover:text-gray-200 flex flex-col items-center"
          aria-label={label}
          onClick={toggleDropdown}
        >
          {icon}
          <span className="text-xs mt-1">{label}</span>
        </button>
        <AccountDropdown isOpen={isDropdownOpen} isLoggedIn={isLoggedIn} /> {/* Modifiez cette ligne */}
      </div>
    );
  }

  return (
    <button
      className="text-white hover:text-gray-200 flex flex-col items-center"
      aria-label={label}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

export default NavButton;