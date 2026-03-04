import { neon, NeonQueryFunction } from "@neondatabase/serverless"
import { Pool as PgPool } from "pg"

// Lazy initialization to avoid build-time errors
let localPool: PgPool | null = null
let neonSql: NeonQueryFunction<false, false> | null = null
let initialized = false

function shouldUseNeon(): boolean {
  // Only use Neon HTTP driver for actual Neon cloud URLs
  return process.env.DATABASE_URL?.includes("neon.tech") || false
}

function initDb() {
  if (initialized) return
  
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    // During build, just skip initialization
    return
  }
  
  if (shouldUseNeon()) {
    neonSql = neon(dbUrl)
  } else {
    // Use standard pg for local, Docker, or any non-Neon postgres
    localPool = new PgPool({ connectionString: dbUrl })
  }
  
  initialized = true
}

// SQL tagged template function that works with both local pg and Neon cloud
export async function sql<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  initDb()
  
  if (localPool) {
    // Build parameterized query from template literal
    let query = strings[0]
    for (let i = 0; i < values.length; i++) {
      query += `$${i + 1}` + strings[i + 1]
    }
    const result = await localPool.query(query, values)
    return result.rows as T[]
  } else if (neonSql) {
    // Use Neon HTTP for cloud
    return neonSql(strings, ...values) as Promise<T[]>
  } else {
    throw new Error("Database not configured")
  }
}

export const getPool = () => {
  initDb()
  return localPool
}
