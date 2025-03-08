'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiHome, FiPackage, FiUsers, FiDollarSign, FiSettings, FiMenu, FiX, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardCharts from '../../../components/shop/DashboardCharts';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon }) => (
    <motion.div 
        className="bg-white p-6 rounded-xl shadow-lg"
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
        <div className="flex items-center justify-between mb-4">
            <div className="text-3xl text-blue-500">{icon}</div>
            <div className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {change}
            </div>
        </div>
        <h3 className="text-gray-500 text-sm font-medium uppercase">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </motion.div>
);

const DashboardPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(true);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            const isSmallScreen = window.innerWidth < 768;
            setIsMobile(isSmallScreen);
            setSidebarOpen(!isSmallScreen);
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isMobile) {
                setSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobile]);

    const menuItems = [
        { icon: <FiHome />, text: "Accueil" },
        { icon: <FiPackage />, text: "Produits" },
        { icon: <FiUsers />, text: "Clients" },
        { icon: <FiDollarSign />, text: "Ventes" },
        { icon: <FiSettings />, text: "Paramètres" },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside 
                        ref={sidebarRef}
                        className={`${isMobile ? 'fixed' : 'relative'} z-30 flex flex-col w-64 h-screen bg-white shadow-lg`}
                        initial={isMobile ? { x: "-100%" } : { x: 0 }}
                        animate={{ x: 0 }}
                        exit={isMobile ? { x: "-100%" } : { x: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h1 className="text-2xl font-bold text-blue-600">Ma Boutique</h1>
                            {isMobile && (
                                <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-800">
                                    <FiX size={24} />
                                </button>
                            )}
                        </div>
                        <nav className="flex-grow p-4">
                            <ul className="space-y-2">
                                {menuItems.map((item, index) => (
                                    <motion.li key={index} whileHover={{ x: 5 }}>
                                        <a href="#" className="flex items-center space-x-3 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                                            {item.icon}
                                            <span>{item.text}</span>
                                        </a>
                                    </motion.li>
                                ))}
                            </ul>
                        </nav>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-semibold text-gray-800">Tableau de bord</h2>
                        {isMobile && (
                            <button onClick={() => setSidebarOpen(true)} className="text-2xl text-gray-600">
                                <FiMenu />
                            </button>
                        )}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Ventes totales" value="$12,345" change="+15%" icon={<FiDollarSign />} />
                        <StatCard title="Nouveaux clients" value="123" change="+5%" icon={<FiUsers />} />
                        <StatCard title="Commandes" value="456" change="-2%" icon={<FiPackage />} />
                        <StatCard title="Revenu moyen" value="$789" change="+8%" icon={<FiDollarSign />} />
                    </div>

                    {/* Monthly Target */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Objectif mensuel</h3>
                        <div className="flex items-center justify-between">
                            <div className="text-4xl font-bold text-blue-600">75.55%</div>
                            <div className="text-green-500 flex items-center">
                                <FiChevronUp />
                                <span className="ml-1">10%</span>
                            </div>
                        </div>
                        <p className="text-gray-600 mt-2">Vous avez gagné $3,287 aujourd'hui, c'est plus élevé que le mois dernier. Continuez votre bon travail !</p>
                    </div>

                    {/* Charts */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Statistiques mensuelles</h3>
                        <DashboardCharts />
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Commandes récentes</h3>
                            <button className="text-blue-500 hover:text-blue-600">Voir tout</button>
                        </div>
                        {/* Add your recent orders table or list here */}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;