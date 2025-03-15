import React from 'react';
import Header from '../components/layout/Header';


interface LayoutProps {
  children: React.ReactNode;
  useContainer?: boolean;
  showHeaderFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  useContainer = true, 
  showHeaderFooter = true 
}) => {
  return (
    <>
      {showHeaderFooter && <Header />}
      <main className={`flex-1 ${useContainer ? 'container mx-auto   ' : ''}`}>
        {useContainer ? (
          <div className="bg-white ">
            {children}
          </div>
        ) : (
          children
        )}
      </main>

    </>
  );
};

export default Layout;