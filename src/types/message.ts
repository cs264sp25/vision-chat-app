import { z } from "zod";
import { fileSchema } from "./file";

export const createMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  attachments: z.array(z.string()).optional(),
});

export const updateMessageSchema = createMessageSchema.partial();

export const messageSchema = createMessageSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
  chatId: z.string(),
  attachments: z.array(fileSchema).optional(),
});

export type CreateMessageType = z.infer<typeof createMessageSchema>;
export type UpdateMessageType = z.infer<typeof updateMessageSchema>;
export type MessageType = z.infer<typeof messageSchema>;
