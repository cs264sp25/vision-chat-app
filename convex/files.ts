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
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    type: v.optional(v.union(v.literal("image"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      name: args.name,
      description: args.description,
      storageId: args.storageId,
      url: (await ctx.storage.getUrl(args.storageId)) as string,
      type: args.type,
    });
  },
});

export const update = mutation({
  args: {
    fileId: v.id("files"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("image"), v.literal("other"))),
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
      type: args.type ?? file.type,
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
