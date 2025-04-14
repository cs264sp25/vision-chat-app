import { ConvexError, v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const getAll = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .collect();

    const messagesWithAttachments = await Promise.all(
      messages.map(async (message) => {
        if (message.attachments && message.attachments.length > 0) {
          const attachmentFiles = await Promise.all(
            message.attachments.map((fileId) => ctx.db.get(fileId)),
          );
          return {
            ...message,
            attachments: attachmentFiles,
          };
        }
        return message;
      }),
    );
    
    return messagesWithAttachments;
  },
});

export const getOne = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.messageId);
  },
});

export const create = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("files"))),
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

    // Store the user message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      role: "user",
      attachments: args.attachments,
    });

    // Get all messages in the chat so far, including the new one
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .order("asc") // Ensure messages are in order
      .collect();

    // Transform messages for the AI
    const messagesForAI = await Promise.all(
      messages.map(async (message) => {
        // Start with the text content
        const contentPayload: Array<
          { type: "text"; text: string } | { type: "image"; image: string }
        > = [{ type: "text", text: message.content }];

        // If there are attachments, fetch them and add images to the payload
        if (message.attachments && message.attachments.length > 0) {
          const attachmentFiles = await Promise.all(
            message.attachments.map((fileId) => ctx.db.get(fileId)),
          );

          for (const file of attachmentFiles) {
            // Only include images with a valid URL
            if (file && file.type === "image" && file.url) {
              contentPayload.push({ type: "image", image: file.url });
            }
          }
        }

        return {
          role: message.role,
          content: contentPayload,
        };
      }),
    );

    // Store a placeholder message for the assistant
    const placeholderMessageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: "...",
      role: "assistant",
    });

    // Update the chat message count
    await ctx.db.patch(args.chatId, {
      messageCount: chat.messageCount + 2,
    });

    // Schedule an action that calls ChatGPT and updates the message.
    ctx.scheduler.runAfter(0, internal.openai.completion, {
      messages: messagesForAI, // Pass the transformed messages
      placeholderMessageId,
    });

    return messageId;
  },
});

export const update = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});
