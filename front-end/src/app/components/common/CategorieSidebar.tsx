'use client'

import React, { useState } from 'react';

// Définition des types
interface Subcategory {
  name: string;
  items: string[];
}

interface Category {
  name: string;
  icon: string;
  subcategories: Subcategory[];
}

// Données des catégories (vous pouvez les déplacer dans un fichier séparé si vous préférez)
const categories: Category[] = [
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
  { name: 'Electronics', icon: '📱', subcategories: [
    { name: 'Smartphones', items: ['Android', 'iOS', 'Accessories'] },
    { name: 'Cameras', items: ['DSLR', 'Mirrorless', 'Point & Shoot', 'Action Cameras'] },
    { name: 'TVs', items: ['Smart TVs', 'OLED', 'QLED', '4K', '8K'] },
    { name: 'Audio', items: ['Speakers', 'Headphones', 'Home Theater Systems'] },
  ]},
  { name: 'Home & Garden', icon: '🏡', subcategories: [
    { name: 'Furniture', items: ['Living Room', 'Bedroom', 'Dining Room', 'Office'] },
    { name: 'Kitchen', items: ['Appliances', 'Cookware', 'Utensils', 'Storage'] },
    { name: 'Garden', items: ['Tools', 'Plants', 'Outdoor Furniture', 'Decor'] },
    { name: 'Home Decor', items: ['Wall Art', 'Lighting', 'Rugs', 'Curtains'] },
  ]},
  { name: 'Sports & Outdoors', icon: '⚽', subcategories: [
    { name: 'Fitness', items: ['Exercise Equipment', 'Yoga', 'Weights', 'Accessories'] },
    { name: 'Outdoor Recreation', items: ['Camping', 'Hiking', 'Cycling', 'Water Sports'] },
    { name: 'Team Sports', items: ['Football', 'Basketball', 'Baseball', 'Soccer'] },
    { name: 'Winter Sports', items: ['Skiing', 'Snowboarding', 'Ice Skating'] },
  ]},
  { name: 'Beauty & Health', icon: '💄', subcategories: [
    { name: 'Skincare', items: ['Cleansers', 'Moisturizers', 'Serums', 'Sunscreen'] },
    { name: 'Makeup', items: ['Face', 'Eyes', 'Lips', 'Nails'] },
    { name: 'Hair Care', items: ['Shampoo', 'Conditioner', 'Styling', 'Hair Color'] },
    { name: 'Personal Care', items: ['Bath & Body', 'Oral Care', 'Deodorants'] },
  ]},
  { name: 'Toys & Games', icon: '🎮', subcategories: [
    { name: 'Video Games', items: ['Consoles', 'Games', 'Accessories'] },
    { name: 'Board Games', items: ['Family Games', 'Strategy Games', 'Card Games'] },
    { name: 'Outdoor Toys', items: ['Playsets', 'Ride-On Toys', 'Sports Toys'] },
    { name: 'Educational Toys', items: ['STEM Toys', 'Learning Toys', 'Arts & Crafts'] },
  ]},
];

const DepartmentsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <li className="relative group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:text-[#f90] flex-shrink-0"
      >
        Départements
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[800px] bg-white text-black shadow-lg rounded-md overflow-hidden z-10 flex">
          <div className="w-1/3 bg-white py-2">
            {categories.map((category) => (
              <div 
                key={category.name}
                className={`px-4 py-2 hover:bg-white cursor-pointer ${activeCategory === category.name ? 'bg-white' : ''}`}
                onMouseEnter={() => setActiveCategory(category.name)}
              >
                {category.icon} {category.name}
              </div>
            ))}
          </div>
          <div className="w-2/3 py-2">
            {activeCategory && (
              <div className="px-4">
                <h3 className="font-bold mb-2 text-[#f90]">{activeCategory}</h3>
                {categories.find(cat => cat.name === activeCategory)?.subcategories.map((subcat) => (
                  <div key={subcat.name} className="mb-4">
                    <h4 className="font-semibold mb-1 text-[#f90]">{subcat.name}</h4>
                    <ul>
                      {subcat.items.map((item) => (
                        <li key={item} className="text-sm hover:text-[#f90] cursor-pointer">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
};

export default DepartmentsDropdown;