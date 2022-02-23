# Tiny-seeder

Populate your database with a simple SQL file

```bash
$ npm i tiny-seeder
```

## Documentations

- [Seeder](./documentation/Seeder.md)
- [Utils](./documentation/Utils.md)

## Getting started

- `npm i tiny-seeder @faker-js/faker`

### # Data folder and javascript file creation

- `mkdir ./data`
- `touch ./data/seeder.js`

### # Javascript file content examples (seeder.js)

```js
const { Seeder } = require('tiny-seeder');
const { faker } = require('@faker-js/faker');
const { v4: UUID } = require('uuid');

const tables = [
  // First table
  {
    name: 'company',
    rows: 40,
    uniques: ['suffix', 'name'],
    columns: {
      suffix: faker.company.companySuffix,
      name: faker.company.companyName,
      description: faker.company.catchPhrase,
      site: faker.internet.url,
    },
  },

  // Second table with first table relation
  {
    name: 'product',
    rows: 500,
    columns: {
      name: faker.commerce.productName,
      description: faker.commerce.productDescription,
      department: faker.commerce.department,
      image: faker.image.imageUrl,
      color: { type: faker.commerce.color, nullable: true },
      price: faker.commerce.price,
      company_id: { to: 'company' },
    },
  },

  // Last table
  {
    name: 'client',
    rows: 80,
    columns: {
      uuid: { primary: true, type: UUID },
      username: faker.internet.userName,
      email: { type: faker.internet.email, unique: true },
      password: faker.internet.password,
    },
  },
];

const seeder = new Seeder(tables, { directory: './data', truncate: true });

seeder.generate();
```

<details>
  <summary>Other example</summary>

```js
const { Seeder } = require('tiny-seeder');
const { faker } = require('@faker-js/faker');
const { v4: UUID } = require('uuid');

const seeder = new Seeder(null, { directory: './data' });

seeder.add({
  name: 'company',
  rows: 40,
  uniques: ['suffix', 'name'],
  columns: {
    suffix: faker.company.companySuffix,
    name: faker.company.companyName,
    description: faker.company.catchPhrase,
    site: faker.internet.url,
  },
});

seeder.add({
  name: 'product',
  rows: 500,
  columns: {
    name: faker.commerce.productName,
    description: faker.commerce.productDescription,
    department: faker.commerce.department,
    image: faker.image.imageUrl,
    color: { type: faker.commerce.color, nullable: true },
    price: faker.commerce.price,
    company_id: { to: 'company' },
  },
});

seeder.add({
  name: 'client',
  rows: 80,
  columns: {
    uuid: { primary: true, type: UUID },
    username: faker.internet.userName,
    email: { type: faker.internet.email, unique: true },
    password: faker.internet.password,
  },
});

seeder.remove('client');

seeder.generate();
```

</details>

### # Execute your file !

- `node ./data/generate.js`
- Check sql rendering in [this file](./data/seeds-example.sql)
