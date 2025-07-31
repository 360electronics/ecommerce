import Image from 'next/image'
import React from 'react'

const ProductSpecsSideImages = () => {
  return (
    <div className='  flex-col items-center justify-start my-36 gap-10 sticky inset-0 hidden md:flex'>
      <div>
        <Image src={'/sidebanner1.jpeg'} alt='Side Banner' width={300} height={450} className=' rounded-lg' />
      </div>
      <div>
        <Image src={'/sidebanner2.jpeg'} alt='Side Banner' width={300} height={450} className=' rounded-lg' />
      </div>
    </div>
  )
}

export default ProductSpecsSideImages
