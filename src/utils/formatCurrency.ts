
export const createCurrencyFormatter = (currencySymbol: string) => {
  return (amount: number): string => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
};
