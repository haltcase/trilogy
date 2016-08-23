declare module 'native-or-lie' {
  declare var exports: typeof Promise;
}

declare module 'fs-jetpack' {
  declare function exists (path: string): boolean;
  declare function file (path: string, criteria: {
    content: string | Buffer | Object | Array<any>;
    jsonIndent?: number;
    mode?: number | string;
  }): Object;
  declare function read (path: string, returnAs: string): any;
}

declare module 'knex' {
  declare class SchemaBuilder {
    createTableIfNotExists (name:string, fn:() => void): this;
  }
}

declare module 'sql.js' {
  declare class Database {}
}

declare type ClassOptions = {
  verbose?: Function;
  errorListener?: Function | null;
}
