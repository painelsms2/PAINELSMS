import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage or default to 'light'
    const savedTheme = localStorage.getItem('smsfacil_theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Optional: check OS preference
    // if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    //   return 'dark';
    // }
    return 'light';
  });

  useEffect(() => {
    // Don't override if a public page (landing/login/register) has forced its own theme
    if (document.body.classList.contains('theme-forced')) return;
    // Update local storage
    localStorage.setItem('smsfacil_theme', theme);
    // Apply data attribute to HTML tag
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
