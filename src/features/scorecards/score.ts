/** Three clear levels, with colour on the text only (no coloured fills). */
export const scoreColor = (score: number): string => {
  if (score >= 80) return 'text-status-success';
  if (score >= 60) return 'text-status-warning';
  return 'text-status-error';
};
