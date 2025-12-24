declare module 'react-native-sqlite-storage' {
  export interface SQLiteResultSet {
    insertId: number;
    rowsAffected: number;
    rows: {
      length: number;
      item(index: number): any;
    };
  }

  export interface SQLiteDatabase {
    executeSql(
      sqlStatement: string,
      params?: any[]
    ): Promise<[SQLiteResultSet]>; // note: returns a tuple, not a single object
    transaction(callback: (tx: any) => void): void;
    close(): Promise<void>;
  }

  export interface SQLiteStatic {
    enablePromise(enable: boolean): void;
    openDatabase(
      name: string,
      version?: string,
      displayName?: string,
      size?: number
    ): Promise<SQLiteDatabase>;
    openDatabase(options: {
      name: string;
      location: string;
      createFromLocation?: number | string;
    }): Promise<SQLiteDatabase>;
  }

  const SQLite: SQLiteStatic;
  export default SQLite;
}
