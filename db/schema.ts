import { pgTable, uuid, text, varchar, numeric, timestamp, index, unique } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
}, (table) => ([
  index("customers_name_idx").on(table.name),
  index("customers_user_id_idx").on(table.userId),
  unique("customers_user_id_phone_unique").on(table.userId, table.phone),
]));

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  category: text("category"),
  credit: numeric("credit", { precision: 12, scale: 2 }).notNull().default("0"),
  debit: numeric("debit", { precision: 12, scale: 2 }).notNull().default("0"),
  netBalance: numeric("net_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  index("expenses_customer_id_idx").on(table.customerId),
  index("expenses_date_idx").on(table.date),
  index("expenses_user_id_idx").on(table.userId),
]));

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey(),
  defaultLandingPage: text("default_landing_page").notNull().default("/dashboard"),
});
