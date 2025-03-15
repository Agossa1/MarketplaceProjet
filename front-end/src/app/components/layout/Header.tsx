import React, { useState, useRef, useEffect } from 'react';
import { FaShoppingCart, FaUser, FaChevronDown, FaBars, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import AccountDropdown from '../common/AccountDropdown';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const toggleAccountDropdown = () => {
    setAccountDropdownOpen(!accountDropdownOpen);
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-orange-500 text-white">

      {/* Main bar - mobile */}
      <div className="md:hidden container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">TOKPA MARKET</h1>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <button className="text-2xl" onClick={toggleMobileSearch}>
            <FaSearch />
          </button>
          <button className="text-2xl relative">
            <FaShoppingCart />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
              2
            </span>
          </button>
          <button className="text-2xl" onClick={toggleAccountDropdown}>
            <FaUser />
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="md:hidden container mx-auto px-4 py-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <input
              type="text"
              placeholder="What can we help you find today?"
              className="w-full py-2 px-4 text-gray-700 focus:outline-none"
              value={searchText}
              onChange={handleSearchChange}
            />
            <button className="bg-black hover:bg-gray-800 text-white py-2 px-4 transition duration-300 ease-in-out">
              <FaSearch className="text-xl" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation - mobile */}
      <nav className="md:hidden container mx-auto px-4 py-2 flex justify-between items-center border-t border-gray-200">
        <button 
          className="flex items-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <FaBars className="mr-2" />
          <span>All categories</span>
        </button>
        <button>
          <FaBars />
          <span className="ml-2">Menu</span>
        </button>
      </nav>

      {/* Desktop header */}
      <div className="hidden md:block">

        {/* Main bar */}
        <div className="container min-w-full px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">TOKPA MARKET</h1>
            </div>
          </Link>

          <div className="flex-grow mx-10">
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <input
                type="text"
                placeholder="What can we help you find today?"
                className="w-full py-2 px-4 text-gray-700 focus:outline-none"
                value={searchText}
                onChange={handleSearchChange}
              />
              <button className="bg-black hover:bg-gray-800 text-white py-2 px-4 transition duration-300 ease-in-out">
                <FaSearch className="text-xl" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center text-white">
              <FaShoppingCart className="mr-2 text-xl" />
              <span className="font-medium">My Cart</span>
              <FaChevronDown className="ml-1 text-xs" />
              <span className="ml-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs">2</span>
            </button>
            <div ref={accountDropdownRef} className="relative">
              <div 
                className="flex items-center text-white cursor-pointer"
                onClick={toggleAccountDropdown}
              >
                <FaUser className="mr-2 text-xl" />
                <span className="font-medium">Account</span>
                <FaChevronDown className="ml-1 text-xs" />
              </div>
              <AccountDropdown isOpen={accountDropdownOpen} />
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <nav className="bg-gray-100 border-t border-gray-200">
          <div className="container py-2 px-6">
            <ul className="flex space-x-6">
              <li>
                <Link href="#" className="text-black hover:text-gray-600 font-medium flex items-center">
                  <span className="mr-1">All categories</span>
                  <FaChevronDown className="text-xs" />
                </Link>
              </li>
              <li><Link href="#" className="text-black hover:text-gray-600">PC</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Mac Books</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Informatique</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Téléphonie</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Tendances</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Promotions</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Ventes</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Aide</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Contact</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Help</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Press</Link></li>
              <li><Link href="#" className="text-black hover:text-gray-600">Fournisseur</Link></li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 p-4">
          <ul>
            <li className="py-2"><Link href="#" className="block text-white">Best Sellers</Link></li>
            <li className="py-2"><Link href="#" className="block text-white">Gift Cards</Link></li>
            <li className="py-2"><Link href="#" className="block text-white">Gift Ideas</Link></li>
            <li className="py-2"><Link href="#" className="block text-white">Deal of the day</Link></li>
            <li className="py-2"><Link href="#" className="block text-white">Top Deals</Link></li>
            <li className="py-2"><Link href="#" className="block text-white">Membership Deals</Link></li>
            <li className="py-2"><Link href="#" className="block text-white">New Releases</Link></li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;