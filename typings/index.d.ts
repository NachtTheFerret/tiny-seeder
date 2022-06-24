/* eslint-disable max-classes-per-file */
/**
 * seeder client
 * @public
 */
declare class Seeder {
  /**
   * array of tables x rows x values
   * @internal
   */
  private inserts: Insert[];

  /**
   * output path
   * @internal
   */
  private path: string;

  /**
   * your tables
   */
  public tables: Table[];

  /**
   * create a new seeder
   * @param tables - array of table
   * @param options - seeder options
   * @example
   * new Seeder(tables, { directory: 'seeds' })
   */
  public constructor(tables?: Table[], options?: SeederOptions);

  /**
   * load a new table and add to tables property
   * @param table - table
   */
  public add(table: Table): void;

  /**
   * get a specific table
   * @param name - table name
   * @returns { Table | null }
   */
  public get(name: string): Table | null;

  /**
   * generate seeder file
   * @param options - generate options
   */
  public generate(options?: {
    /**
     * define seed file extension
     * @defaultValue 'sql'
     */
    format?: 'sql' | 'json'
  }): void;

  /**
   * check if table exist or not
   * @param name - table name
   * @returns { boolean }
   */
  public has(name: string): boolean;

  /**
   * delete a table
   * @param name - table name
   * @returns { Table | null }
   */
  public remove(name: string): Table | null;

  /**
   * delete all tables
   */
  public reset(): void;
}

/**
 * @public
 */
declare class Utils {
  /**
   * concat multiple sql seeds file
   * @param paths - sql file path
   * @returns { string }
   */
  static concat(...paths: string[]): string;

  /**
   * @internal
   * @param param0 - value
   * @returns { string }
   */
  static resolve({ value, literal }: Value): string;
}

// ? INTERFACES
/**
 * contains all the rows and values of a table
 * @internal
 */
interface Insert {
  /**
   * insert default table column
   */
  columns: Table['columns'];

  /**
   * table name
   */
  name: string;

  /**
   * all generated table values
   */
  rows: Rows;
}

/**
 * seeder options
 * @public
 */
export interface SeederOptions {
  /**
   * output directory for seeds files
   * @defaultValue './'
   */
  directory?: string;

  /**
   * define if in your sql file the seeder TRUNCATE all table votes before inserting new data
   * @defaultValue false
   */
  truncate?: boolean;
}

/**
 * table column
 * @internal
 */
interface Column {
  /**
   * indicate here if it is a literal type
   * @example
   * literal: 'NOW()'
   * literal: '9 + 7'
   */
  literal?: string;

  /**
   * indicates if the column can be null
   * @defaultValue false
   */
  nullable?: boolean;

  /**
   * indicates if this is the primary key
   * @defaultValue false
   */
  primary?: boolean;

  /**
   * indicates if the column refers to another table
   * @example
   * to: 'company'
   * to: 'another_table'
   */
  to?: string;

  /**
   * indicate the type of field value
   * @example
   * type: () => Math.floor(Math.random() * 80)
   * type: () => 'a static value'
   * type: () => faker.internet.email()
   * type: 'auto' // take loop index
   */
  type?: Type;

  /**
   * indicates whether the column is unique or not
   * @defaultValue false
   */
  unique?: boolean;
}

/**
 * value
 * @internal
 */
interface Value {
  /**
   * indicate here if it is a literal type
   * @example
   * literal: 'NOW()'
   * literal: '9 + 7'
   */
  literal: string | null;

  /**
   * generation function
   */
  gen: (() => Value) | null;

  /**
   * value generated
   */
  value: unknown | null;
}

/**
 * table
 * @public
 */
export interface Table {
  /**
   * table name
   */
  name: string;

  /**
   * number of rows/document desired
   */
  rows: number;

  /**
   * indicates if the table has a pair of unique keys
   */
  uniques?: string[];

  /**
   * indicate the columns of your table
   */
  columns: { [key: string]: Type | Column };
}

// ? TYPES
type Inserts = Insert[];
type Type = 'auto' | (() => unknown);
type Row = Value[];
type Rows = Row[];
