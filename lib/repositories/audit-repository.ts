import { sql } from "../db"

export interface AuditLogEntry {
  id: string
  entity_type: string
  entity_id: string
  action: string
  actor_id: string | null
  details: Record<string, unknown>
  created_at: Date
}

export const auditRepository = {
  async log(data: {
    entity_type: string
    entity_id: string
    action: string
    actor_id?: string | null
    details?: Record<string, unknown>
  }): Promise<AuditLogEntry> {
    const rows = await sql`
      INSERT INTO audit_log (entity_type, entity_id, action, actor_id, details)
      VALUES (
        ${data.entity_type}, 
        ${data.entity_id}, 
        ${data.action}, 
        ${data.actor_id ?? null}, 
        ${JSON.stringify(data.details ?? {})}::jsonb
      )
      RETURNING *
    `
    return rows[0] as unknown as AuditLogEntry
  },
}
