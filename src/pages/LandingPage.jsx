import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import ServicesGrid from '../components/landing/ServicesGrid';
import FaqSection from '../components/landing/FaqSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import TrustStrip from '../components/TrustStrip';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <ServicesGrid />
        <FaqSection />
        <TestimonialsSection />
        <TrustStrip />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
