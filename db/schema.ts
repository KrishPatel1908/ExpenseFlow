import { pgTable, uuid, text, varchar, numeric, timestamp, index } from "drizzle-orm/pg-core";

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  category: text("category"),
  credit: numeric("credit", { precision: 12, scale: 2 }).notNull().default("0"),
  debit: numeric("debit", { precision: 12, scale: 2 }).notNull().default("0"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  note: text("note"),
}, (table) => ([
  index("expenses_customer_name_idx").on(table.customerName),
  index("expenses_date_idx").on(table.date),
  index("expenses_user_id_idx").on(table.userId),
]));
