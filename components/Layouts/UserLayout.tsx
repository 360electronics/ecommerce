import React, { ReactNode } from 'react';
import Header from '../Navigations/Header';
import Footer from '../Navigations/Footer';

interface UserLayoutProps {
  children: ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      <div className=' mt-36 md:mt-20 px-4 md:px-12'>
        {children}
      </div>
      <Footer />
    </>
  );
}

export default UserLayout;
