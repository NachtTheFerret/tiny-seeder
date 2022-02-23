import { existsSync, lstatSync, writeFileSync } from 'fs';
import path from 'path';
import { Utils } from './Utils';

/* Types */
import type Types from '../../typings';

export class Seeder implements Types.Seeder {
  private inserts = <Types.Inserts>[];
  private path: string;
  public tables = <Types.Table[]>[];

  /**
   * @param tables
   * @param options
   * @example
   * const tables = [
   *  {
   *    name: 'company',
   *    rows: 40,
   *    unique: ['suffix', 'name'],
   *    columns: {
   *      suffix: faker.company.companySuffix,
   *      name: faker.company.companyName,
   *      description: faker.company.catchPhrase,
   *      site: faker.internet.url,
   *    }
   *  }
   * ]
   *
   * const seeder = new Seeder(tables, { directory: './data', truncate: true })
   */
  public constructor(tables?: Types.Table[] | null, private options: Types.SeederOptions = {}) {
    if (Array.isArray(tables) && tables.length) tables.forEach((table) => this.add(table));

    this.path = path.join(process.cwd(), options.directory || './');
    if (!existsSync(this.path)) throw Error('path does not exist');
    if (!lstatSync(this.path).isDirectory()) throw Error('path is not a directory');
  }

  /**
   * Add new table
   * @param param0
   * @returns
   * @example
   * seeder.add({
   *  name: 'company',
   *  rows: 40,
   *  uniques: ['suffix', 'name'],
   *  columns: {
   *    suffix: faker.company.companySuffix,
   *    name: faker.company.companyName,
   *    description: faker.company.catchPhrase,
   *    site: faker.internet.url,
   *  },
   * })
   */
  public add(table: Types.Table): void {
    const { name, rows } = table;

    if (!name || typeof name !== 'string') throw TypeError('table name must be a string');
    if (!rows || typeof rows !== 'number') throw TypeError(`table "${name}" :: rows must be a number`);
    if (!table.columns || Array.isArray(table.columns) || typeof table.columns !== 'object')
      throw TypeError(`table "${name}" :: columns must be an object`);

    const columns = Object.entries(table.columns);
    if (!columns.length) throw Error(`table "${name}" :: columns must not be empty`);

    const insert = <Types.Insert>{ columns: table.columns, rows: [], name };

    // ? loop table rows
    for (let i = 0; i < rows; i += 1) {
      const row = <Types.Row>[];

      // ? loop table columns
      for (let y = 0; y < columns.length; y++) {
        const [key, value] = columns[y];
        const config = typeof value === 'object' ? value : null;
        let gen: () => Types.Value; // generate function

        // # primary key
        if (key === 'id' || (config && config.primary)) {
          if (config?.literal) throw Error(`key "${key}" on table "${table.name}" can't be primary and literal`);
          if (config?.nullable) throw Error(`key "${key}" on table "${table.name}" can't be primary and null`);
          if (config?.to) throw Error(`key "${key}" on table "${table.name}" can't be primary and foreign key`);
          // if (config?.unique || (Array.isArray(table.uniques) && table.uniques.includes(key)))
          //   throw Error(`key "${key}" on table "${table.name}" can't be primary and unique key`);
          const base = typeof value === 'object' ? value.type : value;
          const type = base === 'auto' ? () => i + 1 : typeof base === 'function' ? base : null;
          if (!type) throw Error(`key "${key}" on table "${table.name}" has no type for data generator`);

          gen = () => {
            const result = type();
            return insert.rows.some((r) => r[y] === value) ? gen() : { value: result, literal: null, gen };
          };
        } // [end] # primary key
        // # foreign key
        else if (config?.to) {
          if (typeof config.to !== 'string') throw TypeError(`key "${key}" on table "${table.name}" must be a string`);
          if (config.literal) throw Error(`key "${key}" on table "${table.name}" can't be foreign key and literal`);
          if (config.primary) throw Error(`key "${key}" on table "${table.name}" can't be foreign key and primary`);
          if (config.type) throw Error(`key "${key}" on table "${table.name}" can't be foreign key and type`);
          const toTable = this.inserts.find((ins) => ins.name === config.to);
          if (!toTable) throw Error(`table "${config.to}" must be loaded before table "${table.name}"`);
          const primary = Object.entries(toTable.columns).findIndex(
            ([k, v]) => k === 'id' || (typeof v === 'object' && v.primary)
          );
          gen = () => {
            const result =
              primary >= 0
                ? toTable.rows[Math.floor(Math.random() * toTable.rows.length)][primary].value
                : Math.ceil(Math.random() * toTable.rows.length);
            return { value: result, literal: null, gen };
          };
        } // [end] foreign key
        // # basic key
        else {
          if (config?.literal) {
            if (typeof config.literal !== 'string')
              throw TypeError(`key "${key}" on table "${table.name}" must be a string`);
            if (config.type) throw Error(`key "${key}" on table "${table.name}" can't be literal and type`);
            gen = () => ({ value: null, literal: <string>config.literal, gen });
          } else {
            const base = typeof value === 'object' ? value.type : value;
            const type = base === 'auto' ? () => i + 1 : typeof base === 'function' ? base : null;
            if (!type) throw Error(`key "${key}" on table "${table.name}" has no type for data generator`);
            gen = () => ({ value: type(), literal: null, gen });
          }
        } // [end] basic key

        // key is in uniques array
        if (Array.isArray(table.uniques) && table.uniques.includes(key)) {
          if (config?.unique)
            throw Error(`key "${key}" on table "${table.name}" cannot be in uniques array and be unique property`);
          if (config?.literal)
            throw Error(`key "${key}" on table "${table.name}": property unique is not supported for literal property`);
          const old = gen;
          const uniques = <string[]>table.uniques;
          const indexes = columns.reduce((acc, [k], i) => (uniques.includes(k) ? [...acc, i] : acc), <number[]>[]);

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
              for (const index of indexes) {
                if (index === y) continue;
                const r = row[index];
                if (!r.gen) throw Error(`key "${columns[index][0]}" on table "${table.name}" property type error`);
                row[index] = r.gen();
              }
              return gen();
            } else return result;
          };
        } // [end] key is in uniques array
        // # key is unique
        else if (config?.unique) {
          if (config.literal)
            throw Error(`key "${key}" on table "${table.name}": property unique is not supported for literal property`);
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
   * Get a table
   * @param name
   * @returns
   */
  public get(name: string): Types.Table | null {
    const table = this.tables.find((tbl) => tbl.name === name);
    return table || null;
  }

  /**
   * Generate your sql file
   */
  public generate(): void {
    const truncates = <string[]>[];

    const blocks = this.inserts.map(({ columns, name, rows }) => {
      if (this.options.truncate) truncates.push(name);
      const lines = rows.map((row) => `(${row.map((value) => Utils.resolve(value)).join(', ')})`);
      const keys = Object.keys(columns);

      return `-- Table: ${name}\nINSERT INTO "${name}" ("${keys.join('", "')}") VALUES\n${lines.join(',\n')};`;
    });

    const results = ['BEGIN;'];
    if (truncates.length)
      results.push(`-- Drop current data and indexes\nTRUNCATE ${truncates.join(', ')} RESTART IDENTITY;`);
    results.push(blocks.join('\n\n'), 'COMMIT;');

    writeFileSync(path.join(this.path, `seeds-${Date.now()}.sql`), results.join('\n\n'));
  }

  /**
   * Check if table exist
   * @param name
   * @returns
   */
  public has(name: string): boolean {
    return this.tables.some((tbl) => tbl.name === name);
  }

  /**
   * Remove table
   * @param name
   * @returns
   */
  public remove(name: string): Types.Table | null {
    const tableIndex = this.tables.findIndex((tbl) => tbl.name === name);
    const table = this.tables[tableIndex];

    if (!table) return null;
    this.tables.splice(tableIndex, 1);

    const insertIndex = this.inserts.findIndex((tbl) => tbl.name === name);
    if (insertIndex >= 0) this.inserts.splice(insertIndex, 1);

    return table;
  }

  /**
   * Remove all tables
   */
  public reset(): void {
    this.tables = [];
    this.inserts = [];
  }
}
