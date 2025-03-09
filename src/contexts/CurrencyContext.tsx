
import React, { createContext, useContext, useState, useEffect } from 'react';

type CurrencyContextType = {
  currency: string;
  setCurrency: (currency: string) => void;
  currencySymbol: string;
};

const defaultContext: CurrencyContextType = {
  currency: 'EUR',
  setCurrency: () => {},
  currencySymbol: '€',
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

export const useCurrency = () => useContext(CurrencyContext);

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>(() => {
    const savedCurrency = localStorage.getItem('appCurrency');
    return savedCurrency || 'EUR';
  });
  
  const [currencySymbol, setCurrencySymbol] = useState<string>(currencySymbols[currency] || '€');

  useEffect(() => {
    localStorage.setItem('appCurrency', currency);
    setCurrencySymbol(currencySymbols[currency] || '€');
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
