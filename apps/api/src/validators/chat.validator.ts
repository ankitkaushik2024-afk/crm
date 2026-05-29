import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
  mentions: z.array(z.string()).optional(),
  fileUrl: z.string().url('Invalid attachment URL').optional().or(z.literal('')),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
});

export const addMembersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID must be provided'),
});
