'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Define the Product type
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating?: number;
  reviews?: number;
  colors?: string[];
  description?: string;
  seller?: string;
  category?: string;
}

interface ProductCarouselProps {
  products?: Product[];
  title?: string;
  slidesToShow?: number;
}

// Exemple de données de produits
const featuredProducts = [
  {
    id: '1',
    name: 'Apple iPhone 15 Pro Max',
    price: 1999,
    image: '/images/products/iphone15.png',
    rating: 4,
    reviews: 4889,
    colors: ['#000000', '#0047AB', '#E91E63', '#008080']
  },
  {
    id: '2',
    name: 'Apple iMac 27", 1TB HDD',
    price: 2999,
    image: '/images/products/imac.png',
    rating: 4,
    reviews: 3342,
    colors: ['#000000', '#0047AB', '#FFFFFF', '#FFD700']
  },
  {
    id: '3',
    name: 'Samsung Galaxy S23 Ultra',
    price: 1499,
    image: '/images/products/galaxy.png',
    rating: 5,
    reviews: 2156,
    colors: ['#000000', '#4169E1', '#228B22', '#B22222']
  },
  {
    id: '4',
    name: 'Sony PlayStation 5',
    price: 599,
    image: '/images/products/ps5.png',
    rating: 5,
    reviews: 7823,
    colors: ['#FFFFFF', '#000000']
  },
  {
    id: '5',
    name: 'Apple iPad Pro 12.9"',
    price: 1299,
    image: '/images/products/ipad.png',
    rating: 4,
    reviews: 1893,
    colors: ['#000000', '#C0C0C0', '#FFD700']
  },
  {
    id: '6',
    name: 'Bose QuietComfort Headphones',
    price: 349,
    image: '/images/products/headphones.png',
    rating: 4,
    reviews: 4231,
    colors: ['#000000', '#FFFFFF', '#0047AB']
  },
  {
    id: '7',
    name: 'MacBook Pro 16"',
    price: 2499,
    image: '/images/products/macbook.png',
    rating: 5,
    reviews: 3678,
    colors: ['#C0C0C0', '#000000']
  }
];

const ProductCarousel: React.FC<ProductCarouselProps> = ({ 
  products = featuredProducts, 
  title = "Featured Products",
  slidesToShow = 2
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Ensure products is an array and not undefined
  const safeProducts = Array.isArray(products) && products.length > 0 ? products : featuredProducts;
  
  // Initialize quantities with default values
  const [quantities, setQuantities] = useState<Record<string, number>>(
    safeProducts.reduce((acc, product) => ({ ...acc, [product.id]: 1 }), {})
  );
  
  // Initialize selectedColors with default values, handling products that might not have colors
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>(
    safeProducts.reduce((acc, product) => {
      const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : '#000000';
      return { ...acc, [product.id]: defaultColor };
    }, {})
  );
  
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [visibleSlides, setVisibleSlides] = useState(slidesToShow);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleSlides(1);
      } else if (window.innerWidth < 1024) {
        setVisibleSlides(Math.min(2, slidesToShow));
      } else {
        setVisibleSlides(slidesToShow);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [slidesToShow]);

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging && currentIndex < safeProducts.length - visibleSlides) {
        setCurrentIndex(prev => prev + 1);
      } else if (!isDragging) {
        setCurrentIndex(0); // Loop back to the beginning
      }
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, safeProducts.length, visibleSlides, isDragging]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      // Optional: loop to the end
      setCurrentIndex(safeProducts.length - visibleSlides);
    }
  };

  const handleNext = () => {
    if (currentIndex < safeProducts.length - visibleSlides) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Optional: loop to the beginning
      setCurrentIndex(0);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const newQuantity = Math.max(1, (prev[productId] || 1) + delta);
      return { ...prev, [productId]: newQuantity };
    });
  };

  const handleColorSelect = (productId: string, color: string) => {
    setSelectedColors(prev => ({ ...prev, [productId]: color }));
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If dragged more than 100px, change slide
    if (Math.abs(dragOffset) > 100) {
      if (dragOffset > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (dragOffset < 0 && currentIndex < safeProducts.length - visibleSlides) {
        setCurrentIndex(prev => prev + 1);
      }
    }
    
    setDragOffset(0);
  };

  const renderStars = (rating: number = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  // Calculate if we can navigate
  const canGoNext = currentIndex < safeProducts.length - visibleSlides;
  const canGoPrev = currentIndex > 0;

  // Calculate indicators
  const totalPages = Math.ceil(safeProducts.length / visibleSlides);
  const currentPage = Math.floor(currentIndex / visibleSlides) + 1;

  return (
    <div className="w-full my-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`p-2 rounded-full ${
              canGoPrev 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } transition-colors duration-200`}
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm text-gray-500">
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={handleNext}
            disabled={!canGoNext}
            className={`p-2 rounded-full ${
              canGoNext 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } transition-colors duration-200`}
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div 
        className="relative overflow-hidden"
        ref={containerRef}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <motion.div 
          className="flex"
          animate={{ 
            x: isDragging 
              ? -currentIndex * (containerRef.current?.clientWidth || 0) / visibleSlides + dragOffset 
              : -currentIndex * (containerRef.current?.clientWidth || 0) / visibleSlides 
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ touchAction: 'pan-y' }}
        >
          {safeProducts.map((product) => (
            <div 
              key={product.id} 
              className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5"
              style={{ width: `${100 / visibleSlides}%` }}
            >
              <div className="m-2 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative group">
                  <Link href={`/products/${product.id}`}>
                    <div className="relative h-64 overflow-hidden bg-gray-100">
                      <Image
                        src={product.image || '/images/placeholder.png'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'contain' }}
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                  <button 
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors"
                    aria-label={favorites[product.id] ? "Remove from favorites" : "Add to favorites"}
                  >
                           <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill={favorites[product.id] ? "currentColor" : "none"} 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      strokeWidth="2"
                      className={favorites[product.id] ? "text-red-500 h-5 w-5" : "text-gray-400 h-5 w-5"}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                      />
                    </svg>
                  </button>
                </div>
                
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-lg font-semibold mb-1 hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center mb-2">
                    <div className="flex mr-2">
                      {renderStars(product.rating)}
                    </div>
                    {product.reviews && (
                      <span className="text-sm text-gray-500">
                        ({product.reviews.toLocaleString()})
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xl font-bold text-blue-600 mb-3">
                    ${product.price.toLocaleString()}
                  </div>
                  
                  {product.colors && product.colors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Colors:</p>
                      <div className="flex space-x-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(product.id, color)}
                            className={`w-6 h-6 rounded-full border ${
                              selectedColors[product.id] === color 
                                ? 'ring-2 ring-offset-2 ring-blue-500' 
                                : 'hover:scale-110'
                            } transition-all`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select ${color} color`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center border rounded-md">
                      <button 
                        onClick={() => handleQuantityChange(product.id, -1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 border-x">{quantities[product.id] || 1}</span>
                      <button 
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Pagination dots for mobile */}
      <div className="flex justify-center mt-4 sm:hidden">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i * visibleSlides)}
            className={`mx-1 w-2 h-2 rounded-full ${
              Math.floor(currentIndex / visibleSlides) === i 
                ? 'bg-blue-600' 
                : 'bg-gray-300'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;