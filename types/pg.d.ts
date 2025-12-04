declare module 'pg' {
  export class Pool {
    constructor(config?: { connectionString?: string });
    query(text: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount: number }>;
    end(): Promise<void>;
  }
}

