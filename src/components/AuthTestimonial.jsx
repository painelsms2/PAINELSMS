import React, { useState, useEffect } from 'react';
import './AuthTestimonial.css';

const testimonials = [
  {
    quote: "Esta plataforma me ajudou a economizar tempo e atender meus clientes mais rápido do que nunca.",
    author: "Time SMS Fácil"
  },
  {
    quote: "Simples, rápido e confiável. Recebo os códigos em segundos, sem complicação.",
    author: "Ana P."
  },
  {
    quote: "Uso todos os dias para validar contas de clientes. Nunca me deixou na mão.",
    author: "Lucas M."
  },
  {
    quote: "O suporte é ágil e o sistema é super estável, mesmo nos horários de pico.",
    author: "Rafaela S."
  },
  {
    quote: "Migrei de outro serviço e a diferença de velocidade é gigante.",
    author: "Carlos T."
  }
];

export default function AuthTestimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [fadeState, setFadeState] = useState('in');

  useEffect(() => {
    if (isHovered) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const interval = setInterval(() => {
      if (prefersReducedMotion) {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      } else {
        setFadeState('out');
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % testimonials.length);
          setFadeState('in');
        }, 500); // Wait for fade out to complete before swapping
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div 
      className="auth-testimonial-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`auth-testimonial-content ${fadeState}`}>
        <blockquote>
          <p className="auth-testimonial-quote">
            &ldquo;{testimonials[currentIndex].quote}&rdquo;
          </p>
          <footer className="auth-testimonial-author">
            <span className="author-divider">~</span> {testimonials[currentIndex].author}
          </footer>
        </blockquote>
      </div>
      
      <div className="auth-testimonial-indicators">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            className={`indicator-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => {
              if (idx === currentIndex) return;
              setFadeState('out');
              setTimeout(() => {
                setCurrentIndex(idx);
                setFadeState('in');
              }, 300);
            }}
            aria-label={`Ir para o depoimento ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
