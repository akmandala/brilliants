export const validateDescriptionLength = (description: string): string => {
  if (description.length <= 255) return description;
  return `${description.slice(0, 252)}...`;
};

export const buildDescription = (parts: Array<string | undefined>): string => {
  return validateDescriptionLength(parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim());
};
