import { createHash, randomBytes } from "crypto"

interface DbRow { [key: string]: any }
interface Stmt {
  get(...args: any[]): Promise<DbRow | undefined>
  all(...args: any[]): Promise<DbRow[]>
  run(...args: any[]): Promise<{ changes: number; lastInsertRowid?: number | bigint }>
}

interface Db {
  prepare(sql: string): Stmt
  exec(sql: string): Promise<void>
}

const isTurso = !!process.env.TURSO_DB_URL

let db: Db | null = null

export async function getDb(): Promise<Db> {
  if (db) return db

  if (isTurso) {
    const { createClient } = await import("@libsql/client/web")
    const client = createClient({
      url: process.env.TURSO_DB_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    db = {
      prepare(sql: string): Stmt {
        return {
          async get(...args) {
            const res = await client.execute({ sql, args })
            return res.rows[0] as DbRow | undefined
          },
          async all(...args) {
            const res = await client.execute({ sql, args })
            return res.rows as DbRow[]
          },
          async run(...args) {
            const res = await client.execute({ sql, args })
            return { changes: Number(res.rowsAffected || 0), lastInsertRowid: res.lastInsertRowid }
          },
        }
      },
      async exec(sql: string) {
        const statements = sql.split(";").map(s => s.trim()).filter(Boolean)
        for (const stmt of statements) {
          await client.execute(stmt)
        }
      },
    }
    await initSchema(db)
  } else {
    const { DatabaseSync } = await import("node:sqlite")
    const path = await import("path")
    const DB_PATH = path.join(process.cwd(), "data.db")
    const raw = new DatabaseSync(DB_PATH)
    raw.exec("PRAGMA journal_mode = WAL")
    db = {
      prepare(sql: string): Stmt {
        const stmt = raw.prepare(sql)
        return {
          get(...args) { return Promise.resolve(stmt.get(...args) as DbRow | undefined) },
          all(...args) { return Promise.resolve(stmt.all(...args) as DbRow[]) },
          run(...args) {
            const info = stmt.run(...args)
            return Promise.resolve({ changes: Number(info.changes), lastInsertRowid: info.lastInsertRowid })
          },
        }
      },
      async exec(sql: string) {
        raw.exec(sql)
      },
    }
    await initSchema(db)
  }
  return db
}

async function initSchema(db: Db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      totalOrders INTEGER NOT NULL DEFAULT 0,
      totalSpent REAL NOT NULL DEFAULT 0,
      joinedAt TEXT NOT NULL DEFAULT (date('now')),
      status TEXT NOT NULL DEFAULT 'active',
      userId INTEGER REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      productName TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      paymentMethod TEXT NOT NULL DEFAULT 'Credit Card'
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client'
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  try { await db.exec("ALTER TABLE customers ADD COLUMN userId INTEGER REFERENCES users(id)") } catch { /* already exists */ }

  const row = await db.prepare("SELECT COUNT(*) as cnt FROM products").get() as any
  if (!row || row.cnt === 0) {
    await seed(db)
  }
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

interface Session {
  token: string
  userId: number
  role: string
  createdAt: string
}

export async function createSession(userId: number): Promise<string> {
  const token = generateToken()
  const db = await getDb()
  await db.prepare("INSERT INTO sessions (token, userId) VALUES (?, ?)").run(token, userId)
  return token
}

export async function getSession(token: string): Promise<Session | null> {
  const db = await getDb()
  const row = await db.prepare(`
    SELECT s.token, s.userId, s.createdAt, u.role FROM sessions s
    JOIN users u ON u.id = s.userId WHERE s.token = ?
  `).get(token) as any
  return row ? { token: row.token, userId: row.userId, role: row.role, createdAt: row.createdAt } : null
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDb()
  await db.prepare("DELETE FROM sessions WHERE token = ?").run(token)
}

async function seed(db: Db) {
  await db.exec(`
    INSERT OR IGNORE INTO categories (id, name) VALUES
      ('CAT-1', 'Electronics'),
      ('CAT-2', 'Clothing'),
      ('CAT-3', 'Books'),
      ('CAT-4', 'Home & Garden'),
      ('CAT-5', 'Sports');
  `)

  const users = [
    ["Admin User", "admin@dashboard.com", hashPassword("admin123"), "admin"],
    ["Client User", "client@dashboard.com", hashPassword("client123"), "client"],
  ]
  for (const u of users) {
    await db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(...u)
  }

  const products = [
    ["P-1741651200001", "MacBook Pro", "Electronics", 1299.00, 50, "Powerful laptop for professionals", "2024-06-01"],
    ["P-1741651200002", "Leather Jacket", "Clothing", 199.99, 100, "Premium leather jacket", "2024-06-05"],
    ["P-1741651200003", "React Handbook", "Books", 39.99, 200, "Learn React from scratch", "2024-06-10"],
    ["P-1741651200004", "Garden Tool Set", "Home & Garden", 89.99, 75, "Complete garden tool set", "2024-06-15"],
    ["P-1741651200005", "iPhone 15 Pro", "Electronics", 1099.99, 30, "Latest iPhone model", "2024-06-20"],
    ["P-1741651200006", "Running Shoes", "Sports", 129.99, 150, "Comfortable running shoes", "2024-06-25"],
    ["P-1741651200007", "Wireless Earbuds", "Electronics", 179.99, 80, "High-quality wireless earbuds", "2024-07-01"],
    ["P-1741651200008", "Denim Jeans", "Clothing", 89.99, 120, "Classic denim jeans", "2024-07-05"],
    ["P-1741651200009", "TypeScript Guide", "Books", 29.99, 180, "Comprehensive TypeScript guide", "2024-07-10"],
    ["P-1741651200010", "BBQ Grill", "Home & Garden", 299.99, 40, "Outdoor BBQ grill", "2024-07-15"],
    ["P-1741651200011", "Yoga Mat", "Sports", 49.99, 200, "Premium yoga mat", "2024-07-20"],
    ["P-1741651200012", "iPad Air", "Electronics", 699.99, 45, "Powerful tablet for work and play", "2024-07-25"],
    ["P-1741651200013", "Winter Coat", "Clothing", 249.99, 60, "Warm winter coat", "2024-08-01"],
    ["P-1741651200014", "Node.js Book", "Books", 44.99, 150, "Master Node.js development", "2024-08-05"],
    ["P-1741651200015", "Coffee Maker", "Home & Garden", 79.99, 90, "Automatic coffee maker", "2024-08-10"],
  ]

  const customers = [
    ["C-001", "Alice Johnson", "alice@example.com", 12, 2340.50, "2024-06-15", "active", 2],
    ["C-002", "Bob Smith", "bob@example.com", 8, 1250.00, "2024-08-20", "active", null],
    ["C-003", "Charlie Brown", "charlie@example.com", 5, 890.00, "2024-10-01", "active", null],
    ["C-004", "Diana Prince", "diana@example.com", 15, 3450.00, "2024-04-10", "active", null],
    ["C-005", "Eve Wilson", "eve@example.com", 3, 450.00, "2025-01-15", "inactive", null],
  ]

  const transactions = [
    ["T-001", "Alice Johnson", "MacBook Pro", 1299.00, "completed", "2024-06-20T10:30:00", "Credit Card"],
    ["T-002", "Bob Smith", "Leather Jacket", 199.99, "completed", "2024-06-21T14:00:00", "PayPal"],
    ["T-003", "Alice Johnson", "iPhone 15 Pro", 1099.99, "completed", "2024-06-25T09:15:00", "Debit Card"],
    ["T-004", "Charlie Brown", "React Handbook", 39.99, "completed", "2024-06-28T11:00:00", "Credit Card"],
    ["T-005", "Diana Prince", "Garden Tool Set", 89.99, "completed", "2024-07-03T16:30:00", "Credit Card"],
    ["T-006", "Bob Smith", "Running Shoes", 129.99, "completed", "2024-07-08T10:00:00", "Debit Card"],
    ["T-007", "Alice Johnson", "Wireless Earbuds", 179.99, "pending", "2024-07-10T08:45:00", "PayPal"],
    ["T-008", "Eve Wilson", "Denim Jeans", 89.99, "completed", "2024-07-15T13:20:00", "Credit Card"],
    ["T-009", "Diana Prince", "BBQ Grill", 299.99, "completed", "2024-07-20T15:00:00", "Debit Card"],
    ["T-010", "Charlie Brown", "TypeScript Guide", 29.99, "failed", "2024-07-25T09:30:00", "PayPal"],
    ["T-011", "Alice Johnson", "Yoga Mat", 49.99, "completed", "2024-08-01T11:00:00", "Credit Card"],
    ["T-012", "Bob Smith", "iPad Air", 699.99, "completed", "2024-08-05T14:30:00", "Debit Card"],
    ["T-013", "Diana Prince", "Winter Coat", 249.99, "completed", "2024-08-10T10:00:00", "Credit Card"],
    ["T-014", "Alice Johnson", "Node.js Book", 44.99, "pending", "2024-08-15T16:00:00", "PayPal"],
    ["T-015", "Charlie Brown", "Coffee Maker", 79.99, "completed", "2024-08-20T12:00:00", "Debit Card"],
    ["T-016", "Eve Wilson", "MacBook Pro", 1299.00, "completed", "2024-08-25T09:00:00", "Credit Card"],
    ["T-017", "Bob Smith", "Garden Tool Set", 89.99, "completed", "2024-09-01T11:30:00", "Debit Card"],
    ["T-018", "Alice Johnson", "Denim Jeans", 89.99, "completed", "2024-09-05T14:00:00", "Debit Card"],
    ["T-019", "Diana Prince", "iPhone 15 Pro", 1099.99, "completed", "2024-09-10T10:30:00", "Credit Card"],
    ["T-020", "Charlie Brown", "Running Shoes", 129.99, "pending", "2024-09-15T15:00:00", "PayPal"],
  ]

  for (const p of products) {
    await db.prepare("INSERT OR IGNORE INTO products (id, name, category, price, stock, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(...p)
  }
  for (const c of customers) {
    await db.prepare("INSERT OR IGNORE INTO customers (id, name, email, totalOrders, totalSpent, joinedAt, status, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(...c)
  }
  for (const t of transactions) {
    await db.prepare("INSERT OR IGNORE INTO transactions (id, customerName, productName, amount, status, timestamp, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?)").run(...t)
  }
}
