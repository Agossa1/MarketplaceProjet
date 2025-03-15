'use client'
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CarouselItem {
    image: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
}

interface CarouselProps {
    items?: CarouselItem[];
    autoPlayInterval?: number;
}

const Carousel: React.FC<CarouselProps> = ({ items = [], autoPlayInterval = 5000 }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [imageError, setImageError] = useState<Record<number, boolean>>({});
    const [showControls, setShowControls] = useState(false);

    const nextSlide = useCallback(() => {
        if (items.length > 0 && !isTransitioning) {
            setIsTransitioning(true);
            setCurrentSlide((prevSlide) => (prevSlide + 1) % items.length);
            setTimeout(() => setIsTransitioning(false), 700);
        }
    }, [items, isTransitioning]);

    const prevSlide = useCallback(() => {
        if (items.length > 0 && !isTransitioning) {
            setIsTransitioning(true);
            setCurrentSlide((prevSlide) => (prevSlide - 1 + items.length) % items.length);
            setTimeout(() => setIsTransitioning(false), 700);
        }
    }, [items, isTransitioning]);

    const goToSlide = useCallback((index: number) => {
        if (!isTransitioning && index !== currentSlide) {
            setIsTransitioning(true);
            setCurrentSlide(index);
            setTimeout(() => setIsTransitioning(false), 700);
        }
    }, [currentSlide, isTransitioning]);

    useEffect(() => {
        if (!items || items.length <= 1) return;

        const interval = setInterval(nextSlide, autoPlayInterval);
        return () => clearInterval(interval);
    }, [items, autoPlayInterval, nextSlide]);

    const handleImageError = (index: number) => {
        console.error(`Failed to load image: ${items[index].image}`);
        setImageError(prev => ({ ...prev, [index]: true }));
    };

    // Masquer les contrôles après un délai d'inactivité
    useEffect(() => {
        if (!showControls) return;
        
        const timer = setTimeout(() => {
            setShowControls(false);
        }, 3000); // Masquer après 3 secondes d'inactivité
        
        return () => clearTimeout(timer);
    }, [showControls]);

    if (!items || items.length === 0) {
        return <div className="text-center p-4">No items to display</div>;
    }

    return (
        <div 
            className="relative w-full overflow-hidden rounded-lg"
            onClick={() => setShowControls(true)}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Carousel wrapper */}
            <div className="relative h-56 sm:h-72 md:h-96 lg:h-[500px] xl:h-[600px] overflow-hidden rounded-lg">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`absolute w-full h-full transition-opacity duration-700 ease-in-out ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <div className="relative w-full h-full">
                            {imageError[index] ? (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500">Image non disponible</span>
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                                        style={{ 
                                            objectFit: 'cover', 
                                            objectPosition: 'center',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                        priority={index === currentSlide}
                                        onError={() => handleImageError(index)}
                                        unoptimized={true}
                                        className="transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-black/70 via-black/40 to-transparent text-white p-8 md:p-12 lg:p-16">
                                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 text-left">{item.title}</h2>
                                <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mb-4 md:mb-6 max-w-2xl text-left">{item.subtitle}</p>
                                <Link href={item.buttonLink}>
                                    <span className="bg-white text-black py-1 px-3 sm:py-2 sm:px-4 md:py-2 md:px-6 rounded-md hover:bg-gray-200 transition-all hover:shadow-lg font-medium text-xs sm:text-sm md:text-base">
                                        {item.buttonText}
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation buttons - visible only when showControls is true */}
            {showControls && items.length > 1 && (
                <>
                    <button
                        type="button"
                        className="absolute top-1/2 left-2 sm:left-4 z-10 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50 focus:outline-none transform -translate-y-1/2 transition-opacity duration-300"
                        onClick={(e) => {
                            e.stopPropagation();
                            prevSlide();
                        }}
                    >
                        <span className="sr-only">Previous</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <button
                        type="button"
                        className="absolute top-1/2 right-2 sm:right-4 z-10 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50 focus:outline-none transform -translate-y-1/2 transition-opacity duration-300"
                        onClick={(e) => {
                            e.stopPropagation();
                            nextSlide();
                        }}
                    >
                        <span className="sr-only">Next</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </>
            )}

            {/* Indicators - always visible */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
                {items.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full ${
                            index === currentSlide ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToSlide(index);
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                    ></button>
                ))}
            </div>
        </div>
    );
};

export default Carousel;