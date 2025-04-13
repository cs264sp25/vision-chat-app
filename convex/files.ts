import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getAll = query({
  handler: async (ctx) => {
    return ctx.db.query("files").collect();
  },
});

export const getOne = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.fileId);
  },
});

export const create = mutation({
  args: {
    chatId: v.id("chats"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Check if the chat exists
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new ConvexError({
        code: 404,
        message: "Chat not found",
      });
    }

    // Store the file in the database
    const fileId = await ctx.db.insert("files", {
      name: args.name,
      description: args.description,
      storageId: args.storageId,
      url: (await ctx.storage.getUrl(args.storageId)) as string,
    });

    // Return the file ID
    return fileId;
  },
});

export const update = mutation({
  args: {
    fileId: v.id("files"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError({
        code: 404,
        message: "File not found",
      });
    }

    await ctx.db.patch(args.fileId, {
      name: args.name ?? file.name,
      description: args.description ?? file.description,
    });

    return true;
  },
});

export const remove = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError({
        code: 404,
        message: "File not found",
      });
    }
    await ctx.db.delete(args.fileId);

    // Delete the file from storage
    await ctx.storage.delete(file.storageId);

    return true;
  },
});
