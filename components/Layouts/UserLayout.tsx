'use client'
import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '../Navigations/Header';
import Footer from '../Navigations/Footer';

interface UserLayoutProps {
  children: ReactNode;
  isCategory?: boolean
}

const UserLayout: React.FC<UserLayoutProps> = ({ children, isCategory }) => {
  const pathname = usePathname();
  const pathsToHide = ['/signin', '/signup', '/verify-otp', '/checkout'];
  const shouldHideLayout = pathsToHide.includes(pathname) || pathname.startsWith('/admin');

  if (shouldHideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Header isCategory={isCategory} />
      <div className=' mt-36 md:mt-28 px-4 md:px-12'>
        {children}
      </div>
      <Footer />
    </>
  );
}

export default UserLayout;