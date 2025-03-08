'use client'
import React, { useState, useEffect, useCallback } from 'react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';

interface CarouselItem {
    image: string | StaticImageData;
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

    const nextSlide = useCallback(() => {
        if (items.length > 0) {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % items.length);
        }
    }, [items]);

    const prevSlide = useCallback(() => {
        if (items.length > 0) {
            setCurrentSlide((prevSlide) => (prevSlide - 1 + items.length) % items.length);
        }
    }, [items]);

    useEffect(() => {
        if (!items || items.length <= 1) return;

        const interval = setInterval(nextSlide, autoPlayInterval);

        return () => clearInterval(interval);
    }, [items, autoPlayInterval, nextSlide]);

    if (!items || items.length === 0) {
        return <div className="text-center p-4">No items to display</div>;
    }

    return (
        <div className="relative w-full overflow-hidden rounded-2xl shadow-lg bg-gradient-to-r from-blue-900 to-blue-600">
            <div className="relative h-[200px] md:h-[250px] lg:h-[300px]">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`absolute w-full h-full transition-opacity duration-700 ease-in-out ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <div className="absolute inset-0 flex items-center justify-between p-4 md:p-6 lg:p-8">
                            <div className="w-1/2 text-white z-10">
                                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{item.title}</h2>
                                <p className="text-sm md:text-base lg:text-lg mb-3">{item.subtitle}</p>
                                <Link href={item.buttonLink} className="bg-white text-blue-600 px-4 py-1 text-sm md:text-base rounded-full font-semibold hover:bg-blue-100 transition-colors">
                                    {item.buttonText}
                                </Link>
                            </div>
                            <div className="w-1/2 h-full relative">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {items.length > 1 && (
                <>
                    <button
                        className="absolute top-1/2 left-2 z-30 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-1"
                        onClick={prevSlide}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        className="absolute top-1/2 right-2 z-30 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-1"
                        onClick={nextSlide}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div className="absolute z-30 flex space-x-2 -translate-x-1/2 bottom-2 left-1/2">
                        {items.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                                }`}
                                aria-current={index === currentSlide}
                                aria-label={`Slide ${index + 1}`}
                                onClick={() => setCurrentSlide(index)}
                            ></button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Carousel;