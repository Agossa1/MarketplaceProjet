import React from 'react';
import Link from 'next/link';

interface BreadcrumbProps {
  items: string[];
}

const AddressesSection: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="text-sm mb-4">
      {items.map((item, index) => (
        <React.Fragment key={item}>
          {index > 0 && <span className="mx-2">&gt;</span>}
          <Link href="#" className="text-blue-400 hover:text-blue-300">
            {item}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default AddressesSection;