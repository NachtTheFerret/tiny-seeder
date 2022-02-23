# `class` Seeder

```js
new Seeder(tables, options);
```

| parameters        |  type   | optional | default | description                        |
| :---------------- | :-----: | :------: | :-----: | :--------------------------------- |
| tables            | Table[] |   true   |   []    | Tables configuration               |
| options           | object  |   true   |         | Seeder options                     |
| options.directory | string  |   true   |  './'   | Seed file directory                |
| options.truncate  | boolean |   true   |  false  | TRUNCATE table and restart indexes |

## # Properties

### tables

`type` Table[]

## # Methods

### add(table)

Add table in seeder

| parameters | type  | optional | default | description         |
| :--------- | :---: | :------: | :-----: | :------------------ |
| table      | Table |  false   |         | Table configuration |

### get(name)

Get table in seeder

| parameters |  type  | optional | default | description |
| :--------- | :----: | :------: | :-----: | :---------- |
| name       | string |  false   |         | Table name  |

### generate()

Generate sql file

### has(name)

Check if table exists in seeder

| parameters |  type  | optional | default | description |
| :--------- | :----: | :------: | :-----: | :---------- |
| name       | string |  false   |         | Table name  |

### remove(name)

Remove table in seeder

| parameters |  type  | optional | default | description |
| :--------- | :----: | :------: | :-----: | :---------- |
| name       | string |  false   |         | Table name  |

### reset ()

Remove all tables in seeder
