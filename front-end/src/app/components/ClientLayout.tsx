"use client"

import { usePathname } from 'next/navigation';
import Layout from "@/app/components/Layout";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/contenus/shop/dashboard');

  return (
    <Layout showHeaderFooter={!isAuthPage} useContainer={!isAuthPage}>
      {children}
    </Layout>
  );
}