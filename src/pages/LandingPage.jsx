import React, { useLayoutEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import ServicesGrid from '../components/landing/ServicesGrid';
import FaqSection from '../components/landing/FaqSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import Footer from '../components/Footer';

const LandingPage = () => {
  // Force light theme (orange/white branding) — runs before ThemeProvider's useEffect
  useLayoutEffect(() => {
    document.body.classList.add('theme-forced');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      document.body.classList.remove('theme-forced');
      const saved = localStorage.getItem('smsfacil_theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
    };
  }, []);

  return (
    <div className="landing-page">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <ServicesGrid />
        <FaqSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
