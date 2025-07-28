import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  perfil: text("perfil").notNull().default("usuario"), // admin, usuario, vendedor
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  documento: text("documento"), // CPF/CNPJ
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  cep: text("cep"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  codigo: text("codigo").unique(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  custo: decimal("custo", { precision: 10, scale: 2 }),
  categoria: text("categoria"),
  unidade: text("unidade").default("UN"),
  estoqueAtual: integer("estoque_atual").default(0),
  estoqueMinimo: integer("estoque_minimo").default(0),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales Orders table
export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  numero: text("numero").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  dataVenda: timestamp("data_venda").defaultNow(),
  status: text("status").notNull().default("pendente"), // pendente, pago, cancelado
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  desconto: decimal("desconto", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  observacoes: text("observacoes"),
  vendedorId: integer("vendedor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales Order Items table
export const salesOrderItems = pgTable("sales_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => salesOrders.id),
  productId: integer("product_id").references(() => products.id),
  quantidade: integer("quantidade").notNull(),
  precoUnitario: decimal("preco_unitario", { precision: 10, scale: 2 }).notNull(),
  desconto: decimal("desconto", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Financial Transactions table
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // entrada, saida
  categoria: text("categoria").notNull(),
  descricao: text("descricao").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: timestamp("data_vencimento"),
  dataPagamento: timestamp("data_pagamento"),
  status: text("status").notNull().default("pendente"), // pendente, pago, vencido
  orderId: integer("order_id").references(() => salesOrders.id),
  customerId: integer("customer_id").references(() => customers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  createdAt: true,
});

export const insertSalesOrderItemSchema = createInsertSchema(salesOrderItems).omit({
  id: true,
});

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({
  id: true,
  createdAt: true,
});

// Types
// Relations
export const usersRelations = relations(users, ({ many }) => ({
  salesOrders: many(salesOrders),
  financialTransactions: many(financialTransactions),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  salesOrders: many(salesOrders),
  financialTransactions: many(financialTransactions),
}));

export const productsRelations = relations(products, ({ many }) => ({
  salesOrderItems: many(salesOrderItems),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  vendedor: one(users, {
    fields: [salesOrders.vendedorId],
    references: [users.id],
  }),
  items: many(salesOrderItems),
}));

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderItems.orderId],
    references: [salesOrders.id],
  }),
  product: one(products, {
    fields: [salesOrderItems.productId],
    references: [products.id],
  }),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [financialTransactions.customerId],
    references: [customers.id],
  }),
  order: one(salesOrders, {
    fields: [financialTransactions.orderId],
    references: [salesOrders.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type InsertSalesOrderItem = z.infer<typeof insertSalesOrderItemSchema>;

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
