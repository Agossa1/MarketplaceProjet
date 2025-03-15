'use client'
import React, { useState} from 'react';
import Image from 'next/image';
import { FiArrowLeft, FiArrowRight, FiShoppingCart, FiHeart, FiStar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCarousel from "@/app/components/product/CarrouselProduct";

// Color options for products with more vibrant choices
const colorOptions = [
  { name: 'Black', class: 'bg-black', value: 'black' },
  { name: 'Electric Blue', class: 'bg-blue-500', value: 'blue' },
  { name: 'Neon Pink', class: 'bg-pink-500', value: 'pink' },
  { name: 'Emerald', class: 'bg-emerald-500', value: 'emerald' },
  { name: 'Gold', class: 'bg-amber-400', value: 'gold' },
  { name: 'Purple', class: 'bg-purple-600', value: 'purple' },
];

interface ProductListProps {
  products: Product[];
}
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  subcategory: string;
  image: string;
}
// Enhanced Product card component
const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const { id, name, price, image, description } = product;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('black');
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Format price
  const formattedPrice = price !== undefined ? `$${price.toLocaleString()}` : '$0';

  // Mock image navigation
  const totalImages = 4;

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 overflow-hidden">
            {/* Wishlist button */}
            <button
                onClick={toggleWishlist}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full ${
                    isWishlisted
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gray-100'
                } transition-all duration-300 shadow-md`}
                aria-label="Add to wishlist"
            >
              <FiHeart
                  size={18}
                  className={isWishlisted ? 'fill-current' : ''}
              />
            </button>

            {/* Product image with zoom effect */}
            <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative z-0"
            >
              <Image
                  src={image || '/placeholder.png'}
                  alt={name || 'Product'}
                  width={240}
                  height={240}
                  className="object-contain max-h-full transition-all duration-300"
                  priority
              />
            </motion.div>

            {/* Image navigation controls */}
            <AnimatePresence>
              {isHovered && (
                  <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-4 left-0 right-0 flex justify-between px-6"
                  >
                    <button
                        onClick={prevImage}
                        className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
                        aria-label="Previous image"
                    >
                      <FiArrowLeft size={16} />
                    </button>
                    <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  {`${currentImageIndex + 1} / ${totalImages}`}
                </span>
                    <button
                        onClick={nextImage}
                        className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
                        aria-label="Next image"
                    >
                      <FiArrowRight size={16} />
                    </button>
                  </motion.div>
              )}
            </AnimatePresence>

            {/* Product badge */}
            {index < 2 && (
                <div className="absolute top-3 left-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    TRENDING
                  </div>
                </div>
            )}
          </div>

          <div className="p-5 flex flex-col flex-grow">
            {/* Product title */}
            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">{name}</h3>

            {/* Rating */}
            <div className="flex items-center mb-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={i < 4 ? "fill-current" : ""} size={14} />
                ))}
              </div>
              <span className="text-gray-500 text-xs ml-2">(42 reviews)</span>
            </div>

            {/* Product description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

            {/* Buy in installments */}
            <div className="flex items-center mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-2 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-indigo-700 text-sm font-medium">Buy in 4 interest-free payments</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline mb-4">
              <div className="text-gray-900 text-2xl font-bold">{formattedPrice}</div>
              {index % 2 === 0 && (
                  <div className="ml-2 text-sm text-red-500 line-through">
                    ${(price !== undefined ? (price * 1.2).toFixed(2) : '0.00')}
                  </div>
              )}
            </div>

            {/* Color options */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Available Colors:</div>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                    <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-7 h-7 rounded-full ${color.class} transition-all duration-300 ${
                            selectedColor === color.value
                                ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                                : 'hover:scale-110'
                        }`}
                        aria-label={`Select ${color.name} color`}
                    />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-auto">
              <button
                  onClick={toggleWishlist}
                  className={`flex-1 border py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center ${
                      isWishlisted
                          ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <FiHeart className={`mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
                <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
              </button>
              <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg">
                <FiShoppingCart className="mr-2" />
                <span>Buy now</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
  );
};

// Enhanced Product list component
const ProductList = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock products based on the image
  const products = [
    {
      id: '1',
      name: 'Apple iMac 27" Retina 5K Display',
      description: 'Apple M3 Octa Core, 23.8inch, RAM 8GB, SSD 256GB, Apple M3 8-Core, macOS Sonoma',
      price: 1199,
      image: '/images/imac.png',
      seller: 'Apple',
      category: 'computers',
    },
    {
      id: '2',
      name: 'PlayStation 5 Slim Digital Edition',
      description: 'Up to 120fps with 120Hz output, 1TB HDD, 2 Controllers, Ray Tracing.',
      price: 499,
      image: '/images/ps5.png',
      seller: 'Sony',
      category: 'gaming',
    },
    {
      id: '3',
      name: 'MacBook Pro 16" M3 Pro',
      description: 'Apple M3 Pro, 16GB RAM, 512GB SSD, 16-inch Liquid Retina XDR display, macOS Sonoma',
      price: 1999,
      image: '/images/macbook.png',
      seller: 'Apple',
      category: 'computers',
    },
    {
      id: '4',
      name: 'Samsung Galaxy S24 Ultra',
      description: '12GB RAM, 256GB Storage, 200MP Camera, 6.8" Dynamic AMOLED 2X, Snapdragon 8 Gen 3',
      price: 1299,
      image: '/images/galaxy.png',
      seller: 'Samsung',
      category: 'phones',
    },
    {
      id: '5',
      name: 'Sony WH-1000XM5 Headphones',
      description: 'Industry Leading Noise Cancellation, 30-Hour Battery Life, Crystal Clear Calls',
      price: 349,
      image: '/images/headphones.png',
      seller: 'Sony',
      category: 'audio',
    },
    {
      id: '6',
      name: 'iPad Pro 12.9" M2 Chip',
      description: 'Liquid Retina XDR display, M2 chip, 12MP Wide camera, 10MP Ultra Wide camera',
      price: 1099,
      image: '/images/ipad.png',
      seller: 'Apple',
      category: 'tablets',
    },
  ];

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    // Filter by category
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }

    // Filter by seller
    if (selectedSellers.length > 0 && !selectedSellers.includes(product.seller)) {
      return false;
    }

    // Filter by price range
    if (product.price < priceRange[0] || product.price > priceRange[1]) {
      return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOrder) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0; // Default to original order
    }
  });

  // Get unique sellers for filter
  const sellers = [...new Set(products.map(product => product.seller))];

  // Get unique categories for filter
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'computers', name: 'Computers' },
    { id: 'phones', name: 'Phones' },
    { id: 'tablets', name: 'Tablets' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'audio', name: 'Audio' },
  ];

  // Toggle seller selection
  const toggleSeller = (seller: string) => {
    if (selectedSellers.includes(seller)) {
      setSelectedSellers(selectedSellers.filter(s => s !== seller));
    } else {
      setSelectedSellers([...selectedSellers, seller]);
    }
  };

  // Handle price range change
  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    if (type === 'min') {
      setPriceRange([value, priceRange[1]]);
    } else {
      setPriceRange([priceRange[0], value]);
    }
  };

  return (
      <div className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <ProductCarousel products={sortedProducts.slice(0, 6)} />

        {/* Filters and products section */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <motion.div
              className={`lg:w-1/4 bg-white rounded-xl shadow-lg p-6 ${showFilters ? 'block' : 'hidden lg:block'} h-fit sticky top-24`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Filters</h2>
              <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Categories filter */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                            selectedCategory === category.id
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      {category.name}
                    </button>
                ))}
              </div>
            </div>

            {/* Price range filter */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-3">Price Range</h3>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceRangeChange('min', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm text-gray-600">Min: ${priceRange[0]}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceRangeChange('max', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm text-gray-600">Max: ${priceRange[1]}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceRangeChange('min', parseInt(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceRangeChange('max', parseInt(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brands filter */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-3">Brands</h3>
              <div className="space-y-2">
                {sellers.map((seller) => (
                    <div key={seller} className="flex items-center">
                      <input
                          type="checkbox"
                          id={`seller-${seller}`}
                          checked={selectedSellers.includes(seller)}
                          onChange={() => toggleSeller(seller)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`seller-${seller}`} className="ml-2 text-gray-700">
                        {seller}
                      </label>
                    </div>
                ))}
              </div>
            </div>

            {/* Reset filters button */}
            <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSellers([]);
                  setPriceRange([0, 2000]);
                  setSortOrder('');
                }}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </motion.div>

          {/* Products grid */}
          <div className="lg:w-3/4">
            {/* Mobile filter toggle and sort controls */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filters
              </button>

              <div className="flex items-center gap-2">
                <span className="text-gray-700">Sort by:</span>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-medium">{sortedProducts.length}</span> products
                {selectedCategory !== 'all' && (
                    <> in <span className="font-medium">{categories.find(c => c.id === selectedCategory)?.name}</span></>
                )}
              </p>
            </div>

            {/* Products grid */}
            {sortedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product) => (
                      <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
                      >
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                          <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <button className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {product.category}
                      </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-gray-900">${product.price}</span>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </motion.div>
                  ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters to find what you're looking for.</p>
                  <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedSellers([]);
                        setPriceRange([0, 2000]);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
            )}

            {/* Pagination */}
            {sortedProducts.length > 0 && (
                <div className="mt-10 flex justify-center">
                  <nav className="flex items-center gap-1">
                    <button className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">1</button>
                    <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">2</button>
                    <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">3</button>
                    <button className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default ProductList;