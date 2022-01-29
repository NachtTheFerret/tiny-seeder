# Tiny-seeder

A module to create a simple SQL file to populate your development database

```bash
$ npm i tiny-seeder
```

## Getting started

> First of all, you need to drop your tables and recreate them. In order to reset the counters of the primary keys (Required for the proper functioning of the script)

### # Install modules

- `npm i tiny-seeder community-faker`

I use [community-faker](https://www.npmjs.com/package/community-faker) for generate random data

### # Create data folder and a javascript file

- `mkdir ./data`
- `cd ./data`
- `touch generate.js`

### # Open yout javascript file (generate.js)

```js
const { seeder } = require('tiny-seeder');
const faker = require('community-faker');

seeder([
  // first table
  {
    name: 'user',
    rows: 50,
    columns: {
      firstname: faker.name.firstName,
      middlename: { nullable: true, type: faker.name.middleName },
      lastname: faker.name.lastName,
      email: { type: faker.internet.email, unique: true },
      age: () => Math.floor(Math.random() * 26),
    },
  },
  // second table
  {
    name: 'cookies',
    rows: 40,
    columns: {
      id: 'auto',
      user_id: { to: 'user', unique: true },
      stock: () => Math.floor(Math.random() * 50),
      eating: () => Math.floor(Math.random() * 4),
    },
  },
]);
```

### # Execute your file !

- `node ./data/generate.js`

TADA !!! SQL file created !

## Documentation

| property             | value                  | optional | description                                     |
| :------------------- | :--------------------- | :------- | :---------------------------------------------- |
| name                 | string                 | false    | name of table                                   |
| rows                 | number                 | false    | number of rows to insert                        |
| uniques              | string[]               | true     | couple of unique key                            |
| columns              | object                 | false    | columns of table                                |
| columns.key          |                        |          | key is column name                              |
| columns.key          | [type](#type) / object | false    | unction to generate random data / column option |
| columns.key.literal  | string                 | true     | literal is not escaped                          |
| columns.key.nullable | boolean                | true     | true for this column is possibility null        |
| columns.key.primary  | boolean                | true     | define primary key                              |
| columns.key.to       | string                 | true     | name of relation table                          |
| columns.key.type     | [type](#type)          | true     | function to generate random data                |
| columns.key.unique   | boolean                | true     | define unique column                            |

> **WARNING**: If you get a RangeError, check the row count of the related tables. You may be asking too much

> If a table refers to a table that does not have a primary key, the primary key will be 'auto' so the row number

### incompatible properties

- **literal** not compatible with primary, to, type, unique
- **nullable** not compatible with primary
- **primary** not compatible with literal, nullable, to, unique
- **to** not compatible with type, primary, literal
- **type** not compatible with literal, to
- **unique** not compatible with primary

## Typings

### Type

|      value      | description          |
| :-------------: | :------------------- |
|    `'auto'`     | use row index        |
| `() => unknown` | generate random data |
