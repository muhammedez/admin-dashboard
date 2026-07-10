declare module "node:sqlite" {
  interface StatementSync {
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint }
    get(...params: any[]): Record<string, any> | undefined
    all(...params: any[]): Record<string, any>[]
  }

  export class DatabaseSync {
    constructor(filename: string, options?: { open?: boolean })
    prepare(sql: string): StatementSync
    exec(sql: string): void
    close(): void
  }
}
