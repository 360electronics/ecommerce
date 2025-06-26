import React from 'react'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}

      {/* Mobile-only bottom bar */}
      <div className='fixed bottom-0 w-screen h-[6vh] pt-[1px] bg-white grid grid-cols-2 gap-2 px-3 shadow-md md:hidden'>
        {/* <button className="px-4 py-2 bg-gray-200  font-medium">Add to Cart</button>
        <button className="px-4 py-2 bg-blue-600 text-white  font-medium">Buy Now</button> */}
        <button
            // onClick={handleAddToCart}
            className="flex-1 py-2 px-4 rounded-full cursor-pointer border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2 font-medium text-sm"
          >
            Add to cart
            <svg className='w-5 h-5' viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5H17.5L16 12H6.5L5 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path
                d="M5 5L4.5 3H2.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 12L6 14H16.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7.5" cy="17" r="1" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="15.5" cy="17" r="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            // onClick={handleBuyNow}
            className="flex-1 py-2 px-4 rounded-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 font-medium text-sm"
          >
            Buy Now
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.75 10H16.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M11.25 5L16.25 10L11.25 15"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
      </div>
    </div>
  )
}

export default Layout
