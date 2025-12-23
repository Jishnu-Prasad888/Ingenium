export const generateId = (): string => {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000_000)}`;
};


export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getDate()}/${date.getMonth() + 1}/${date
    .getFullYear()
    .toString()
    .substr(2)}`;
};
