export const isSecondProduct = (product?: { name?: string } | null): boolean => {
  if (!product || !product.name) return false;
  return /second/i.test(product.name);
};

export const getProductCondition = (product?: { name?: string } | null) => {
  const isSecond = isSecondProduct(product);
  return {
    isSecond,
    label: isSecond ? 'Sepatu Second' : 'Sepatu Baru',
    shortLabel: isSecond ? 'SECOND' : 'BARU',
  };
};
