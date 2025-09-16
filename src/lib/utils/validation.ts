import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Geçerli bir e-posta adresi giriniz')
export const uuidSchema = z.string().uuid('Geçerli bir UUID formatı gerekli')
export const nonEmptyStringSchema = z.string().min(1, 'Bu alan boş bırakılamaz')

// Task validation
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'review', 'completed'])

export const taskPayloadSchema = z.object({
  id: uuidSchema,
  title: nonEmptyStringSchema,
  project_id: uuidSchema.optional(),
  project_title: z.string().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  due_date: z.string().nullable().optional(),
  url: z.string().url().optional(),
})

// Team validation
export const teamInviteSchema = z.object({
  team_id: uuidSchema,
  email: emailSchema,
  role: z.enum(['member', 'admin']),
})

// Project validation
export const projectCreateSchema = z.object({
  title: nonEmptyStringSchema.max(100, 'Başlık en fazla 100 karakter olabilir'),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').nullable().optional(),
  team_id: uuidSchema.optional(),
})

// Validation utility functions
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`Validation failed: ${messages.join(', ')}`)
    }
    throw error
  }
}

export function safeValidateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const validData = schema.parse(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Rate limiting validation
export const rateLimitSchema = z.object({
  identifier: nonEmptyStringSchema,
  limit: z.number().positive(),
  window: z.number().positive(),
})

// File upload validation
export const fileUploadSchema = z.object({
  filename: nonEmptyStringSchema,
  size: z.number().max(10 * 1024 * 1024, 'Dosya boyutu en fazla 10MB olabilir'),
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(type),
    'Desteklenen dosya türleri: JPEG, PNG, GIF, PDF'
  ),
})
