import { z } from "zod";

export const createFileSchema = z.object({
  name: z.string().optional(),
  file: z.optional(z.instanceof(File)),
});

export const updateFileSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const fileSchema = updateFileSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
  storageId: z.string(), // This is a reference to the Convex storage object
  url: z.string(), // This is the URL we can use to download the file
  type: z.enum(["image", "other"]).optional(),
});

export type CreateFileType = z.infer<typeof createFileSchema>;
export type UpdateFileType = z.infer<typeof updateFileSchema>;
export type FileType = z.infer<typeof fileSchema>;
