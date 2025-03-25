
export const createCurrencyFormatter = (currencySymbol: string = '€') => {
  return (amount: number): string => {
    return `€${amount.toFixed(2)}`;
  };
};
