
import React, { createContext, useContext } from 'react';

type CurrencyContextType = {
  currency: string;
  currencySymbol: string;
};

const defaultContext: CurrencyContextType = {
  currency: 'EUR',
  currencySymbol: '€',
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fixed currency value as EUR
  const currency = 'EUR';
  const currencySymbol = '€';

  return (
    <CurrencyContext.Provider value={{ currency, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
