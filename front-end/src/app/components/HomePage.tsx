import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const HomePage = () => {
  return (
    <div className="relative w-full h-[600px] overflow-hidden bg-gradient-to-r from-indigo-900 to-purple-800">
      {/* Overlay pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('/patterns/circuit-board.svg')]"></div>

      {/* Content container */}
      <div className="container mx-auto h-full flex items-center">
        {/* Left text content - positioned to the left */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-1/2 z-10 text-white px-6 md:px-10"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Découvrez l'Avenir du Commerce
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-lg">
            Connectez-vous directement avec des fabricants vérifiés et explorez des produits de qualité à des prix compétitifs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 rounded-lg font-medium flex items-center justify-center hover:shadow-lg transition duration-300">
              Explorer les produits <FiArrowRight className="ml-2" />
            </button>
            <button className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm px-8 py-3 rounded-lg font-medium hover:bg-opacity-30 transition duration-300">
              Devenir vendeur
            </button>
          </div>
        </motion.div>

        {/* Right image carousel - with 3D perspective effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:block absolute right-0 top-0 h-full w-2/3 overflow-hidden"
          style={{
            clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)',
            boxShadow: '-10px 0 20px rgba(0,0,0,0.3)'
          }}
        >
          <div className="relative h-full w-full">
            {/* Use local placeholder images instead of remote ones */}
            <Image
              src="/placeholder-hero.jpg"
              alt="Marketplace products showcase"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />

            {/* Floating product cards */}
            <motion.div
              className="absolute bottom-20 left-20 bg-white rounded-lg p-4 shadow-xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <div className="w-48 h-48 bg-gray-200 rounded-md mb-2"></div>
              <p className="font-medium">Produit Tendance</p>
              <div className="flex items-center mt-1">
                <span className="text-orange-500 font-bold">€129.99</span>
                <span className="ml-2 line-through text-gray-500 text-sm">€199.99</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;