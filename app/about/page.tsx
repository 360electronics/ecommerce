'use client'
import HeroSection from '@/components/About/Hero'
import MainSec from '@/components/About/MainSec'
import StickyScroll from '@/components/About/OurJourney'
import UserLayout from '@/components/Layouts/UserLayout'
import React from 'react'

const page = () => {
  return (
    <UserLayout isCategory={false}>
        <HeroSection/>
        <MainSec/>
        <StickyScroll/>
    </UserLayout>
  )
}

export default page