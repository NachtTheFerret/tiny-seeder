import path from 'path';
import { readdirSync, readFileSync, existsSync, lstatSync } from 'fs';

/* Types */
import type Types from '../../typings';

export class Utils implements Types.Utils {
  /**
   * Contact sql files
   * @param paths
   * @returns
   * @example
   * Utils.contact('./path/to/directory')
   * Utils.contact('./path/to/directory', './path/to/file.sql', './path/to/other-file.sql')
   * Utils.contact('./path/to/file.sql', './path/to/other-file.sql')
   */
  static concat(...paths: string[]): string {
    const results = ['BEGIN;'];

    paths.forEach((p) => {
      const to = path.join(process.cwd(), p);

      if (!existsSync(to)) throw Error(`${to} not exist`);
      if (!lstatSync(to).isDirectory() && !lstatSync(to).isFile()) throw Error(`${to} is not a directory or file`);

      const directory = lstatSync(to).isFile() ? path.dirname(to) : to;
      const files = lstatSync(to).isFile() ? [path.basename(to)] : readdirSync(to);

      files.forEach((file) => {
        if (!file.endsWith('.sql')) return;
        const content = readFileSync(path.join(directory, file), { encoding: 'utf-8', flag: 'r' });
        const result = content.replace(/(BEGIN|COMMIT|ROLLBACK);?/, '').trim();
        results.push(result);
      });
    });

    return [...results, 'COMMIT;'].join('\n\n');
  }

  /**
   * Get stringify value for sql
   * @param param0
   * @returns
   */
  static resolve({ value, literal }: Types.Value): string {
    if (value !== null) {
      if (typeof value === 'number') return (value || 0) + '';
      if (typeof value === 'boolean') return value + '';
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return `'${(<string>value).replace(/'/g, "''")}'`;
    } else return literal + '';
  }
}
