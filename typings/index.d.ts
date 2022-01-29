declare function seeder(tables: Table[]): void;

interface Column {
  literal?: string;
  nullable?: boolean;
  primary?: boolean;
  to?: string;
  type?: Type;
  unique?: boolean;
}

interface Insert {
  columns: Table['columns'];
  name: string;
  rows: Rows;
}

type Inserts = Insert[];

interface Value {
  literal: string | null;
  gen: (() => Value) | null;
  value: unknown | null;
}

type Row = Value[];

type Rows = Row[];

type Type = 'auto' | (() => unknown);

export interface Table {
  name: string;
  rows: number;
  uniques?: string[];
  columns: { [key: string]: Type | Column };
}
