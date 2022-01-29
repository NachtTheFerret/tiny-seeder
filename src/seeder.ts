import { writeFileSync } from 'fs';
import path from 'path';

import utils from './utils';

/* Types */
import type { Insert, Inserts, Row, Value, Table } from '../typings';

/**
 * Generate random data and create sql file
 * @param { Table[] } tables
 */
export function seeder(tables: Table[]): void {
  if (!Array.isArray(tables)) throw Error('tables must be an array');
  if (!tables.length) throw Error("tables can't be empty");

  // ? loop all tables
  const inserts = <Inserts>[];
  for (const table of tables) {
    if (typeof table.name !== 'string') throw TypeError(`name of table "${table.name}" must be a string`);
    if (typeof table.rows !== 'number') throw TypeError(`rows of table "${table.name}" must be a number`);
    if (typeof table.columns !== 'object') throw TypeError(`columns of table "${table.name}" must be an object`);

    const columns = Object.entries(table.columns);
    if (!columns.length) throw Error(`columns of table "${table.name}" must not be empty`);

    const insert = <Insert>{ columns: table.columns, rows: [], name: table.name };

    // ? loop rows
    for (let i = 0; i < table.rows; i++) {
      const row = <Row>[];

      // ? loop columns of table
      for (let y = 0; y < columns.length; y++) {
        const [key, value] = columns[y];
        const config = typeof value === 'object' ? value : null;
        let gen: () => Value; // generate function

        // # primary key
        if (key === 'id' || (config && config.primary)) {
          if (config?.literal) throw Error(`key "${key}" on table "${table.name}" can't be primary and literal`);
          if (config?.nullable) throw Error(`key "${key}" on table "${table.name}" can't be primary and null`);
          if (config?.to) throw Error(`key "${key}" on table "${table.name}" can't be primary and foreign key`);
          if (config?.unique || (Array.isArray(table.uniques) && table.uniques.includes(key)))
            throw Error(`key "${key}" on table "${table.name}" can't be primary and unique key`);
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
          const toTable = inserts.find((ins) => ins.name === config.to);
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

        row.push(
          config && config.nullable ? (Math.random() < 0.75 ? gen() : { literal: 'NULL', value: null, gen }) : gen()
        );
      } // [end] loop columns of table

      insert.rows.push(row);
    } // [end] loop rows

    inserts.push(insert);
  } // [end] loop all tables

  // # write block
  const blocks = <string[]>[];
  for (const { columns, name, rows } of inserts) {
    const lines = <string[]>[];

    for (const row of rows) {
      const line = <string[]>[];
      for (const value of row) line.push(utils.resolve(value));
      lines.push(`(${line.join(', ')})`);
    }

    blocks.push(
      `-- Table: ${name}\nINSERT INTO "${name}" ("${Object.keys(columns).join('", "')}") VALUES\n${lines.join(',\n')};`
    );
  }

  writeFileSync(path.join(process.cwd(), 'seeds.sql'), ['BEGIN;', blocks.join('\n\n'), 'COMMIT;'].join('\n\n'));
}
