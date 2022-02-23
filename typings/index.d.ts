declare class Seeder {
  public tables: Table[];
  public constructor(tables?: Table[] | null, options?: SeederOptions);
  public add(table: Table): void;
  public get(name: string): Table | null;
  public generate(): void;
  public has(name: string): boolean;
  public remove(name: string): Table | null;
  public reset(): void;
}

declare class Utils {
  static concat(...paths: string[]): string;
  static resolve(value: Value): string;
}

// ? INTERFACES
interface Insert {
  columns: Table['columns'];
  name: string;
  rows: Rows;
}

interface SeederOptions {
  directory?: string;
  truncate?: boolean;
}

interface Column {
  literal?: string;
  nullable?: boolean;
  primary?: boolean;
  to?: string;
  type?: Type;
  unique?: boolean;
}

interface Value {
  literal: string | null;
  gen: (() => Value) | null;
  value: unknown | null;
}

export interface Table {
  name: string;
  rows: number;
  uniques?: string[];
  columns: { [key: string]: Type | Column };
}

// ? TYPES
type Inserts = Insert[];
type Type = 'auto' | (() => unknown);
type Row = Value[];
type Rows = Row[];
