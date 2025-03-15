import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  seller: string;
  category: string;
}

interface ProductCarouselProps {
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleSlides, setVisibleSlides] = useState(1);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  // Determine number of visible slides based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setVisibleSlides(3); // xl
      } else if (window.innerWidth >= 1024) {
        setVisibleSlides(3); // lg
      } else if (window.innerWidth >= 768) {
        setVisibleSlides(2); // md
      } else {
        setVisibleSlides(1); // sm and xs
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (!autoplayEnabled) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === Math.max(0, products.length - visibleSlides) ? 0 : prevIndex + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplayEnabled, products.length, visibleSlides]);

  // Ensure we don't go out of bounds
  const safeProducts = products.length > 0 ? products : [];
  const maxIndex = Math.max(0, safeProducts.length - visibleSlides);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => Math.min(maxIndex, prevIndex + 1));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setAutoplayEnabled(false);
    
    // Get the starting position
    if ('touches' in e) {
      setDragStart(e.touches[0].clientX);
    } else {
      setDragStart(e.clientX);
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    // Calculate how far we've dragged
    let currentPosition: number;
    if ('touches' in e) {
      currentPosition = e.touches[0].clientX;
    } else {
      currentPosition = e.clientX;
    }
    
    const diff = currentPosition - dragStart;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    // Determine if we should move to the next/prev slide based on drag distance
    const threshold = 100; // pixels
    
    if (dragOffset > threshold && currentIndex > 0) {
      handlePrev();
    } else if (dragOffset < -threshold && currentIndex < maxIndex) {
      handleNext();
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    
    // Re-enable autoplay after a short delay
    setTimeout(() => setAutoplayEnabled(true), 5000);
  };

  // If no products, don't render
  if (safeProducts.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden my-8 rounded-xl shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Featured Products</h2>
      
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
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
              className={`flex-shrink-0 w-full px-2 ${
                visibleSlides === 1 ? 'w-full' : 
                visibleSlides === 2 ? 'w-1/2' : 
                'w-1/3'
              }`}
            >
              <Link href={`/product/${product.id}`}>
                <div className="bg-white rounded-xl shadow-md overflow-hidden h-full transform transition-transform hover:scale-105 hover:shadow-xl">
                  <div className="relative h-64 bg-gray-100">
                    <Image 
                      src={product.image} 
                      alt={product.name}
                      fill
                      style={{ objectFit: 'contain' }}
                      className="p-4"
                    />
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-blue-600 font-semibold mb-1">{product.seller}</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">${product.price}</span>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`p-2 rounded-full ${
            currentIndex === 0 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Dots indicator */}
        <div className="flex space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full ${
                currentIndex === index ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <button 
          onClick={handleNext}
          disabled={currentIndex === maxIndex}
          className={`p-2 rounded-full ${
            currentIndex === maxIndex 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Autoplay toggle */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => setAutoplayEnabled(!autoplayEnabled)}
          className={`p-2 rounded-full ${
            autoplayEnabled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}
          title={autoplayEnabled ? "Pause autoplay" : "Start autoplay"}
        >
          {autoplayEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCarousel;