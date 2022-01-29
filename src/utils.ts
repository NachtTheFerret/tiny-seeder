import type { Value } from '../typings';

export default {
  resolve: ({ value, literal }: Value): string => {
    if (value !== null) {
      if (typeof value === 'number') return (value || 0) + '';
      if (typeof value === 'boolean') return value + '';
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return `'${(<string>value).replace(/'/g, "''")}'`;
    } else return literal + '';
  },
};
