import { z } from "zod"
import { NextResponse } from "next/server"

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const first = result.error.issues[0]
    const message = first ? `${first.path.join(".")}: ${first.message}` : "Validation failed"
    return { error: NextResponse.json({ error: message }, { status: 400 }) }
  }
  return { data: result.data }
}

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0).optional().default(0),
  description: z.string().optional().default(""),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().positive("Price must be positive").optional(),
  stock: z.number().int().min(0).optional(),
  description: z.string().optional(),
})

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
})

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email("Invalid email").optional(),
  status: z.enum(["active", "inactive"]).optional(),
  totalOrders: z.number().int().min(0).optional(),
  totalSpent: z.number().min(0).optional(),
})

export const createTransactionSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  productName: z.string().min(1, "Product name is required"),
  amount: z.number().positive("Amount must be positive"),
  quantity: z.number().int().min(1).optional().default(1),
  status: z.enum(["completed", "pending", "failed"]).optional().default("completed"),
  paymentMethod: z.string().min(1).optional().default("Credit Card"),
})

export const updateTransactionSchema = z.object({
  customerName: z.string().min(1).optional(),
  productName: z.string().min(1).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  status: z.enum(["completed", "pending", "failed"]).optional(),
  paymentMethod: z.string().min(1).optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").transform((s) => s.trim()),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").transform((s) => s.trim()),
})

export const placeOrderSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  paymentMethod: z.string().min(1, "Payment method is required").default("Credit Card"),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
})
