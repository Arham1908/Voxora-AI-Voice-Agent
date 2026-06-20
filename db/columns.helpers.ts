import {timestamp} from "drizzle-orm/pg-core"
// columns.helpers.ts
const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
}
