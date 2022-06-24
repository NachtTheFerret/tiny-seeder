/* eslint-disable jest/no-commented-out-tests */
import { faker } from '@faker-js/faker';
import { v4 as UUID } from 'uuid';
import { Seeder } from '../src';

/* Types */
import type { Table } from '../typings';

const tables = <Table[]>[
  {
    name: 'company',
    rows: 40,
    uniques: ['suffix', 'name'],
    columns: {
      suffix: () => faker.company.companySuffix(),
      name: () => faker.company.companyName(),
      description: () => faker.company.catchPhrase(),
      site: () => faker.internet.url(),
    },
  },
  {
    name: 'product',
    rows: 250,
    columns: {
      name: () => faker.commerce.productName(),
      description: () => faker.commerce.productDescription(),
      department: () => faker.commerce.department(),
      image: () => faker.image.imageUrl(),
      color: { type: () => faker.commerce.color(), nullable: true },
      price: () => faker.commerce.price(),
      company_id: { to: 'company' },
    },
  },
  {
    name: 'client',
    rows: 80,
    columns: {
      uuid: { primary: true, type: UUID },
      username: () => faker.internet.userName(),
      email: { type: () => faker.internet.email(), unique: true },
      password: () => faker.internet.password(),
    },
  },
];

describe('seeder tool', () => {
  // it('seeding tables', () => {
  //   expect.hasAssertions();

  //   const seeder = new Seeder(tables, { truncate: true, directory: './tests' });

  //   expect(seeder.tables).toHaveLength(tables.length);
  // });

  // it('add table to add method', () => {
  //   expect.hasAssertions();

  //   const seeder = new Seeder();
  //   tables.forEach((table) => seeder.add(table));

  //   expect(seeder.tables).toHaveLength(tables.length);
  // });

  // it('missing properties', () => {
  //   expect.hasAssertions();

  //   const seeder = new Seeder();

  //   expect(() => seeder.add(<Table>{})).toThrow(TypeError);
  //   expect(() => seeder.add({ name: '', rows: 0,
  // columns: {} })).toThrow('table name must be a string');
  //   expect(() => seeder.add({ name: 'toto', rows: 0,
  // columns: {} })).toThrow('table "toto" :: rows must be a number');
  //   expect(() => seeder.add({ name: 'toto', rows: 4,
  // columns: <Table['columns']>(<unknown>null) })).toThrow(
  //     'table "toto" :: columns must be an object'
  //   );
  //   expect(() => seeder.add({ name: 'toto', rows: 4, columns: {} })).toThrow(
  //     'table "toto" :: columns must not be empty'
  //   );
  // });

  // it('unknown values', () => {
  //   expect.hasAssertions();

  //   const seeder = new Seeder();
  //   const table = { name: 'toto', rows: 4 };

  //   expect(() => seeder.add({ ...table, columns: { key: {} } })).toThrow(
  //     'key "key" on table "toto" has no type for data generator'
  //   );
  //   expect(() => seeder.add({ ...table, columns: { key: { to: 'foo' } } })).toThrow(
  //     'table "foo" must be loaded before table "toto"'
  //   );
  //   expect(() => seeder.add({ ...table, columns:
  // { key: { nullable: true, unique: true } } })).toThrow(
  //     'key "key" on table "toto" has no type for data generator'
  //   );
  //   expect(() => seeder.add({ ...table, columns:
  // { key: { nullable: true, primary: true } } })).toThrow(
  //     'key "key" on table "toto" can\'t be primary and null'
  //   );
  // });

  it('generate sql file', () => {
    expect.hasAssertions();

    expect(new Seeder(tables, { directory: './tests', truncate: true }).generate()).toBeFalsy();
  });
});

// describe('utils functions', () => {
//   it('concat', () => {
//     expect.hasAssertions();

//     expect(typeof Utils.concat('./tests')).toBe('string');
//   });
// });
