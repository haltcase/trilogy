import Knex = require('knex');
import knex = require('knex');

type Data = { [key: string]: any }
type Criteria = Data | [string, any] | [string, string, any];

declare class Trilogy {
  constructor (
    path: string,
    options: {
      client?: string,
      dir?: string,
      verbose?: () => void
    }
  );

  models: string[];
  knex: Knex;

  model (
    name: string,
    schema: { [key: string]: any },
    options?: {
      timestamps?: boolean,
      primary?: string[],
      unique?: string[]
    }
  ): Promise<Model>;

  hasModel (name: string): Promise<boolean>;
  dropModel (name: string): Promise<void>;
  raw (query: knex.QueryBuilder, needResponse?: boolean): Promise<any>;
  close (): Promise<void>;

  // model methods

  create (
    model: string,
    object: Data,
    options?: {
      raw?: boolean
    }
  ): Promise<Data>;

  find (
    model: string,
    criteria?: Criteria,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      limit?: number,
      skip?: number,
      raw?: boolean
    }
  ): Promise<Array<Data|any>>;

  find (
    model: string,
    column: string,
    criteria?: Criteria,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      limit?: number,
      skip?: number,
      raw?: boolean
    }
  ): Promise<Array<Data|any>>;

  findOne (
    model: string,
    criteria?: Criteria,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      skip?: number,
      raw?: boolean
    }
  ): Promise<Data|any>;

  findOne (
    model: string,
    column: string,
    criteria?: Criteria,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      skip?: number,
      raw?: boolean
    }
  ): Promise<Data|any>;

  findOrCreate (
    model: string,
    criteria?: Criteria,
    creation?: Data,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      skip?: number,
      raw?: boolean
    }
  ): Promise<Data>;

  update (
    model: string,
    data: Data,
    options?: {
      raw?: boolean
    }
  ): Promise<number>;

  update (
    model: string,
    critiera: Criteria,
    data: Data,
    options?: {
      raw?: boolean
    }
  ): Promise<number>;

  updateOrCreate (
    model: string,
    criteria?: Criteria,
    data?: Data,
    options?: {
      raw?: boolean
    }
  ): Promise<number>;

  get<T> (
    model: string,
    column: string,
    criteria?: Criteria,
    defaultValue?: T,
    options?: {
      raw?: boolean
    }
  ): Promise<T>;

  set<T> (
    model: string,
    column: string,
    criteria?: Criteria,
    value?: T,
    options?: {
      raw?: boolean
    }
  ): Promise<number>;

  getRaw<T> (
    model: string,
    column: string,
    criteria?: Criteria,
    defaultValue?: T
  ): Promise<T>;

  setRaw<T> (
    model: string,
    column: string,
    criteria?: Criteria,
    value?: T
  ): Promise<number>;

  incr (
    model: string,
    column: string,
    criteria?: Criteria,
    amount?: number
  ): Promise<number>;

  decr (
    model: string,
    column: string,
    criteria?: Criteria,
    amount?: number
  ): Promise<number>;

  remove (
    model: string,
    criteria?: Criteria
  ): Promise<number>;

  clear (
    model: string,
  ): Promise<number>;

  count (
    model: string,
    column?: string,
    criteria?: Criteria,
    options?: {
      distinct?: boolean,
      group?: string
    }
  ): Promise<number>;

  min (
    model: string,
    column: string,
    criteria?: Criteria,
    options?: {
      group?: string
    }
  ): Promise<number>;

  max (
    model: string,
    column: string,
    criteria?: Criteria,
    options?: {
      group?: string
    }
  ): Promise<number>;
}

declare class Model {
  create (object: Data, options?: {}): Promise<Data>;

  find (
    criteria?: Criteria,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      limit?: number,
      skip?: number,
      raw?: true
    }
  ): Promise<Array<Data|any>>;

  find (
    column: string,
    criteria?: Criteria,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      limit?: number,
      skip?: number,
      raw?: true
    }
  ): Promise<Array<Data|any>>;

  findOne (
    criteria?: Criteria,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      skip?: number,
      raw?: true
    }
  ): Promise<Data|any>;

  findOne (
    column: string,
    criteria?: Criteria,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      skip?: number,
      raw?: true
    }
  ): Promise<Data|any>;

  findOrCreate (
    criteria?: Criteria,
    creation?: Data,
    options?: {
      random?: boolean,
      order?: string | [string, string],
      skip?: number,
      raw?: true
    }
  ): Promise<Data>;

  update (
    data: Data,
    options?: {
      raw?: true
    }
  ): Promise<number>;

  update (
    critiera: Criteria,
    data: Data,
    options?: {
      raw?: true
    }
  ): Promise<number>;

  updateOrCreate (
    criteria?: Criteria,
    data?: Data,
    options?: {
      raw?: true
    }
  ): Promise<number>;

  get<T> (
    column: string,
    criteria?: Criteria,
    defaultValue?: T
  ): Promise<T>;

  set<T> (
    column: string,
    criteria?: Criteria,
    value?: T
  ): Promise<number>;

  getRaw<T> (
    column: string,
    criteria?: Criteria,
    defaultValue?: T
  ): Promise<T>;

  setRaw<T> (
    column: string,
    criteria?: Criteria,
    value?: T
  ): Promise<number>;

  incr (
    column: string,
    criteria?: Criteria,
    amount?: number
  ): Promise<number>;

  decr (
    column: string,
    criteria?: Criteria,
    amount?: number
  ): Promise<number>;

  remove (
    criteria?: Criteria
  ): Promise<number>;

  clear (): Promise<number>;

  count (
    column?: string,
    criteria?: Criteria,
    options?: {
      distinct?: boolean,
      group?: string
    }
  ): Promise<number>;

  min (
    column: string,
    criteria?: Criteria,
    options?: {
      group?: string
    }
  ): Promise<number>;

  max (
    column: string,
    criteria?: Criteria,
    options?: {
      group?: string
    }
  ): Promise<number>;
}

export = Trilogy