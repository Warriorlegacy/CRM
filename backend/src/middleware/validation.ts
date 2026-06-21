import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().nullable(),
  tags: z.string().optional().default(''),
  stage: z.enum(['new', 'followup', 'negotiation', 'won', 'lost']).optional().default('new'),
  assignedToId: z.string().optional().nullable(),
  notes: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  bodyText: z.string().min(1, 'Message body is required'),
  type: z.enum(['text', 'image', 'document', 'audio', 'video']).optional().default('text'),
});

export const templateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(1, 'Body is required').max(4096),
  category: z.enum(['marketing', 'utility', 'authentication']).optional().default('utility'),
});

export const workspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().optional(),
});

export const waAccountSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
  businessAccountId: z.string().min(1, 'Business Account ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
  webhookVerifyToken: z.string().optional(),
});

export const typingSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  status: z.enum(['typing', 'idle']),
});

export const readReceiptSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  messageIds: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  workspaceName: z.string().min(2).optional(),
});

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
    const result = schema.safeParse(data);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  };
}
