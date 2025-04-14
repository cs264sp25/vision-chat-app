import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    messageCount: v.number(),
  }),
  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    attachments: v.optional(v.array(v.id("files"))),
  }).index("by_chat_id", ["chatId"]),
  files: defineTable({
    storageId: v.id("_storage"), // This is a reference to the Convex storage object
    url: v.string(), // This is the URL we can use to download the file
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("image"), v.literal("other"))),
  }),
});
