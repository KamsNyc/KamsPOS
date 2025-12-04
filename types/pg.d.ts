declare module 'pg' {
  export class Pool {
    constructor(config?: { connectionString?: string });
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}

