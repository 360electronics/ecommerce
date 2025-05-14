import React, { ReactNode } from 'react';
import { MdLock as Lock } from "react-icons/md";
import Image from 'next/image';

interface CheckoutLayoutProps {
    children: ReactNode;
}

const CheckoutLayout: React.FC<CheckoutLayoutProps> = ({ children }) => {
    return (
        <>
            <div className=' top-0 flex justify-between items-center px-8 py-4 w-full z-100 bg-white border-b border-gray-200'>
                <div>
                    <Image src={'/logo/360.svg'} alt='360 Checkout' width={150} height={150} className='' />
                </div>
                <div className=' flex items-center justify-center gap-2'>
                    <Lock size={24} /> <h1 className=' nohemi-bold text-lg'>Secure <span className=' text-primary'>Checkout</span></h1>
                </div>
            </div>
            <div className='  relative'>
                {children}
            </div>
        </>
    );
}

export default CheckoutLayout;
