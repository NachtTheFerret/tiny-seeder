import { existsSync, lstatSync, writeFileSync } from 'fs';
import path from 'path';

import type {
  Insert,
  Row,
  SeederOptions,
  Table,
  Value,
} from '../../typings';

import Utils from './Utils.service';

/**
 * seeder client
 * @public
 */
export default class Seeder {
  /**
   * array of tables x rows x values
   * @internal
   */
  private inserts = <Insert[]>[];

  /**
   * output path
   * @internal
   */
  private path: string;

  /**
   * your tables
   */
  public tables = <Table[]>[];

  /**
   * create a new seeder
   * @param tables - array of table
   * @param options - seeder options
   * @example
   * new Seeder(tables, { directory: 'seeds' })
   */
  public constructor(tables?: Table[], private options: SeederOptions = { }) {
    const to = path.join(process.cwd(), options.directory || './');
    if (!existsSync(to)) throw Error('path does not exist');
    if (!lstatSync(to).isDirectory()) throw Error('path is not a directory');
    this.path = to;

    if (tables) tables.forEach((table) => this.add(table));
  }

  /**
   * load a new table and add to tables property
   * @param table - table
   */
  public add(table: Table): void {
    const { name, rows } = table;

    if (!name || typeof name !== 'string') throw TypeError('table name must be a string');
    if (!rows || typeof rows !== 'number') throw TypeError(`table "${name}" :: rows must be a number`);
    if (!table.columns || Array.isArray(table.columns) || typeof table.columns !== 'object') { throw TypeError(`table "${name}" :: columns must be an object`); }

    const columns = Object.entries(table.columns);
    if (!columns.length) throw Error(`table "${name}" :: columns must not be empty`);
    const insert = <Insert>{ columns: table.columns, rows: [], name };

    // ? loop table rows
    for (let i = 0; i < rows; i += 1) {
      const row = <Row>[];

      // ? loop table columns
      for (let y = 0; y < columns.length; y += 1) {
        const [key, value] = columns[y];
        const config = typeof value === 'object' ? value : null;
        let gen: () => Value; // generate function

        // # primary key
        if (key === 'id' || (config && config.primary)) {
          if (config?.literal) throw Error(`key "${key}" on table "${table.name}" can't be primary and literal`);
          if (config?.nullable) throw Error(`key "${key}" on table "${table.name}" can't be primary and null`);
          if (config?.to) throw Error(`key "${key}" on table "${table.name}" can't be primary and foreign key`);
          // if (config?.unique || (Array.isArray(table.uniques) && table.uniques.includes(key)))
          //   throw Error(`key "${key}" on table "${table.name}" can't be primary and unique key`);
          const base = typeof value === 'object' ? value.type : value;
          let type = null as (() => unknown) | null;
          if (base === 'auto') type = () => i + 1;
          if (typeof base === 'function') type = base;
          if (!type) throw Error(`key "${key}" on table "${table.name}" has no type for data generator`);

          gen = () => {
            const result = (type as (() => unknown))();
            const keyExist = insert.rows.some((r) => r[y] === value);
            return keyExist ? gen() : { value: result, literal: null, gen };
          };
        } else if (config?.to) {
          // # foreign key
          if (typeof config.to !== 'string') throw TypeError(`key "${key}" on table "${table.name}" must be a string`);
          if (config.literal) throw Error(`key "${key}" on table "${table.name}" can't be foreign key and literal`);
          if (config.primary) throw Error(`key "${key}" on table "${table.name}" can't be foreign key and primary`);
          if (config.type) throw Error(`key "${key}" on table "${table.name}" can't be foreign key and type`);
          const toTable = this.inserts.find((ins) => ins.name === config.to);
          if (!toTable) throw Error(`table "${config.to}" must be loaded before table "${table.name}"`);
          const primary = Object.entries(toTable.columns).findIndex(
            ([k, v]) => k === 'id' || (typeof v === 'object' && v.primary),
          );
          gen = () => {
            const result = primary >= 0
              ? toTable.rows[Math.floor(Math.random() * toTable.rows.length)][primary].value
              : Math.ceil(Math.random() * toTable.rows.length);
            return { value: result, literal: null, gen };
          };
        } else if (config?.literal) {
          // # basic key
          if (typeof config.literal !== 'string') throw TypeError(`key "${key}" on table "${table.name}" must be a string`);
          if (config.type) throw Error(`key "${key}" on table "${table.name}" can't be literal and type`);
          gen = () => ({ value: null, literal: <string>config.literal, gen });
        } else {
          const base = typeof value === 'object' ? value.type : value;
          let type = null as (() => unknown) | null;
          if (base === 'auto') type = () => i + 1;
          if (typeof base === 'function') type = base;
          if (!type) throw Error(`key "${key}" on table "${table.name}" has no type for data generator`);
          gen = () => ({ value: (type as (() => unknown))(), literal: null, gen });
        } // [end] basic key

        // key is in uniques array
        if (Array.isArray(table.uniques) && table.uniques.includes(key)) {
          if (config?.unique) { throw Error(`key "${key}" on table "${table.name}" cannot be in uniques array and be unique property`); }
          if (config?.literal) { throw Error(`key "${key}" on table "${table.name}": property unique is not supported for literal property`); }
          const old = gen;
          const uniques = <string[]>table.uniques;
          const indexes = columns.reduce((acc, [k], accI) => {
            const indexesAcc = uniques.includes(k) ? [...acc, accI] : acc;
            return indexesAcc;
          }, <number[]>[]);

          gen = () => {
            const result = old();
            const results = indexes.map((x) => (x === y ? result : row[x]));
            if (results.some((r) => typeof r === 'undefined')) return result;
            const stringifyA = results.reduce((acc, v) => acc + v.value, '');
            const test = insert.rows.some((v) => {
              const stringifyB = indexes.map((x) => v[x]).reduce((acc, u) => acc + u.value, '');
              return stringifyA === stringifyB;
            });

            if (test) {
              // eslint-disable-next-line no-restricted-syntax
              for (const index of indexes) {
                if (index !== y) {
                  const r = row[index];
                  if (!r.gen) throw Error(`key "${columns[index][0]}" on table "${table.name}" property type error`);
                  row[index] = r.gen();
                }
              }
              return gen();
            } return result;
          };
        } else if (config?.unique) {
          // # key is unique
          if (config.literal) { throw Error(`key "${key}" on table "${table.name}": property unique is not supported for literal property`); }
          const index = columns.findIndex(([k]) => k === key);
          const old = gen;
          gen = () => {
            const result = old();
            return insert.rows.some((r) => r[index].value === result.value) ? gen() : result;
          };
        } // [end] key is unique

        if (config && config.nullable) row.push(Math.random() < 0.75 ? gen() : { literal: 'NULL', value: null, gen });
        else row.push(gen());
      } // [end] loop columns of table

      insert.rows.push(row);
    } // [end] loop rows

    this.tables.push(table);
    this.inserts.push(insert);
  }

  /**
   * get a specific table
   * @param name - table name
   * @returns { Table | null }
   */
  public get(name: string): Table | null {
    const table = this.tables.find((tbl) => tbl.name === name);
    return table || null;
  }

  /**
   * generate seeder file
   * @param options - generate options
   */
  public generate(options: { format?: 'sql' | 'json' } = {}): void {
    if (!options.format || options.format === 'sql') {
      const truncates = <string[]>[];

      const blocks = this.inserts.map(({ columns, name, rows }) => {
        if (this.options.truncate) truncates.push(name);
        const lines = rows.map((row) => `(${row.map((value) => Utils.resolve(value)).join(', ')})`);
        const keys = Object.keys(columns);

        return `-- Table: ${name}\nINSERT INTO "${name}" ("${keys.join('", "')}") VALUES\n${lines.join(',\n')};`;
      });

      const results = ['BEGIN;'];
      if (truncates.length) { results.push(`-- Drop current data and indexes\nTRUNCATE "${truncates.join('", "')}" RESTART IDENTITY;`); }
      results.push(blocks.join('\n\n'), 'COMMIT;');

      writeFileSync(path.join(this.path, `seeds-${Date.now()}.sql`), results.join('\n\n'));
    } else if (options.format === 'json') {
      const tables = this.inserts.map(({ columns, name, rows }) => {
        const keys = Object.keys(columns);

        const table = rows.map((row) => {
          const obj = <{ [key: string]: unknown }>{};
          row.forEach((val, i) => { obj[keys[i]] = val; });
          return obj;
        });

        return { [name]: table };
      });

      writeFileSync(
        path.join(this.path, `seeds-${Date.now()}.json`),
        JSON.stringify(tables),
      );
    }
  }

  /**
   * check if table exist or not
   * @param name - table name
   * @returns { boolean }
   */
  public has(name: string): boolean {
    return this.tables.some((tbl) => tbl.name === name);
  }

  /**
   * delete a table
   * @param name - table name
   * @returns { Table | null }
   */
  public remove(name: string): Table | null {
    const tableIndex = this.tables.findIndex((tbl) => tbl.name === name);
    const table = this.tables[tableIndex];

    if (!table) return null;
    this.tables.splice(tableIndex, 1);

    const insertIndex = this.inserts.findIndex((tbl) => tbl.name === name);
    if (insertIndex >= 0) this.inserts.splice(insertIndex, 1);

    return table;
  }

  /**
   * delete all tables
   */
  public reset(): void {
    this.tables = [];
    this.inserts = [];
  }
}
