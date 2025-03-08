import React, { useState } from 'react';
import Link from 'next/link';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

const categories = [
  { name: 'Computer & Office', icon: '💻', subcategories: [
    { name: 'Laptops', items: ['Gaming', '2 in 1', 'Business', 'Home Office', 'Ultrabook'] },
    { name: 'Tablets', items: ['Best Sellers', 'Phone Call Functionality', 'Supports USB OTG', 'IOS', 'Android', 'Flowbite Global Store'] },
    { name: 'Monitors', items: ['Build-In Speakers', 'Audio & HIFI', 'Headphones', 'Home Cinema', 'Sat Nav & Car Electronics'] },
    { name: 'Desktop PC', items: ['Gaming PC', 'Home Office', 'Servers', 'Mini PC', 'All in One PC'] },
    { name: 'Printers & Ink', items: ['Best Sellers', 'Laser Printers', 'Inkjet Printers'] },
  ]},
  { name: 'Fashion/Clothes', icon: '👚', subcategories: [
    { name: 'Women', items: ['Dresses', 'Tops', 'Jeans', 'Shoes', 'Accessories'] },
    { name: 'Men', items: ['Shirts', 'Pants', 'Suits', 'Shoes', 'Accessories'] },
    { name: 'Kids', items: ['Girls', 'Boys', 'Baby', 'Shoes', 'Accessories'] },
  ]},
  { name: 'Electronics', icon: '🔌', subcategories: [
    { name: 'Smartphones', items: ['Android', 'iOS', 'Accessories'] },
    { name: 'Audio', items: ['Headphones', 'Speakers', 'Home Audio'] },
    { name: 'Cameras', items: ['DSLR', 'Mirrorless', 'Point & Shoot', 'Accessories'] },
  ]},
  { name: 'Gaming/Consoles', icon: '🎮', subcategories: [
    { name: 'Consoles', items: ['PlayStation', 'Xbox', 'Nintendo'] },
    { name: 'Games', items: ['Action', 'RPG', 'Sports', 'Strategy'] },
    { name: 'Accessories', items: ['Controllers', 'Headsets', 'Gaming Chairs'] },
  ]},
  { name: 'TV/Projectors', icon: '📺', subcategories: [
    { name: 'TVs', items: ['4K', 'OLED', 'Smart TV', 'Large Screen'] },
    { name: 'Projectors', items: ['Home Theater', 'Portable', 'Short Throw'] },
    { name: 'Accessories', items: ['Mounts', 'Cables', 'Remote Controls'] },
  ]},
  { name: 'Collectibles & Toys', icon: '🧸', subcategories: [
    { name: 'Action Figures', items: ['Superheroes', 'Anime', 'Movie Characters'] },
    { name: 'Board Games', items: ['Strategy', 'Family', 'Party Games'] },
    { name: 'Collectible Cards', items: ['Trading Cards', 'Sports Cards'] },
  ]},
  { name: 'Sports & Outdoors', icon: '⚽', subcategories: [
    { name: 'Fitness', items: ['Exercise Equipment', 'Yoga', 'Weights'] },
    { name: 'Outdoor Recreation', items: ['Camping', 'Hiking', 'Cycling'] },
    { name: 'Team Sports', items: ['Football', 'Basketball', 'Baseball'] },
  ]},
  { name: 'Food & Grocery', icon: '🛒', subcategories: [
    { name: 'Fresh Food', items: ['Fruits & Vegetables', 'Meat & Seafood', 'Dairy'] },
    { name: 'Pantry', items: ['Canned Goods', 'Pasta & Rice', 'Snacks'] },
    { name: 'Beverages', items: ['Coffee & Tea', 'Soft Drinks', 'Juices'] },
  ]},
  { name: 'Health & Beauty', icon: '💄', subcategories: [
    { name: 'Skincare', items: ['Cleansers', 'Moisturizers', 'Sunscreen'] },
    { name: 'Makeup', items: ['Face', 'Eyes', 'Lips'] },
    { name: 'Personal Care', items: ['Hair Care', 'Oral Care', 'Body Care'] },
  ]},
  { name: 'Car & Motorbike', icon: '🚗', subcategories: [
    { name: 'Car Accessories', items: ['Interior', 'Exterior', 'Electronics'] },
    { name: 'Motorcycle Gear', items: ['Helmets', 'Jackets', 'Gloves'] },
    { name: 'Tools & Maintenance', items: ['Oils & Fluids', 'Batteries', 'Tires'] },
  ]},
  { name: 'Books', icon: '📚', subcategories: [
    { name: 'Fiction', items: ['Mystery', 'Romance', 'Science Fiction'] },
    { name: 'Non-Fiction', items: ['Biography', 'Self-Help', 'History'] },
    { name: 'Children\'s Books', items: ['Picture Books', 'Chapter Books', 'Educational'] },
  ]},
  { name: 'Home Air Quality', icon: '🌬️', subcategories: [
    { name: 'Air Purifiers', items: ['HEPA', 'Activated Carbon', 'UV'] },
    { name: 'Humidifiers', items: ['Cool Mist', 'Warm Mist', 'Ultrasonic'] },
    { name: 'Dehumidifiers', items: ['Portable', 'Whole House', 'Mini'] },
  ]},
  { name: 'Photo/Video', icon: '📷', subcategories: [
    { name: 'Cameras', items: ['DSLR', 'Mirrorless', 'Point & Shoot'] },
    { name: 'Lenses', items: ['Prime', 'Zoom', 'Wide Angle'] },
    { name: 'Accessories', items: ['Tripods', 'Lighting', 'Camera Bags'] },
  ]},
];

// Le reste du code reste inchangé

const CategoryDropdown: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
      <div className="flex">
        <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
          {categories.map((category) => (
              <div
                  key={category.name}
                  className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between ${
                      activeCategory === category.name ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setActiveCategory(category.name)}
              >
            <span className="flex items-center">
              <span className="mr-3 text-xl">{category.icon}</span>
              {category.name}
            </span>
                <FaChevronRight className="text-gray-400" />
              </div>
          ))}
        </div>
        {activeCategory && (
            <div className="flex-1 p-6 bg-white">
              <h2 className="text-2xl font-bold mb-6">{activeCategory}</h2>
              <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                {categories
                    .find((c) => c.name === activeCategory)
                    ?.subcategories?.map((subcategory) => (
                        <div key={subcategory.name} className="mb-6">
                          <h3 className="font-semibold text-lg mb-3">{subcategory.name}</h3>
                          <ul className="space-y-2">
                            {subcategory.items.map((item) => (
                                <li
                                    key={item}
                                    className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
                                >
                                  {item}
                                </li>
                            ))}
                          </ul>
                        </div>
                    ))}
              </div>
            </div>
        )}
      </div>
  );
};

export default CategoryDropdown;