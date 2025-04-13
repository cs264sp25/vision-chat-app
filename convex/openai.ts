import OpenAI from "openai";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const completion = internalAction({
  args: {
    messages: v.array(
      v.object({
        role: v.union(
          v.literal("system"),
          v.literal("user"),
          v.literal("assistant"),
        ),
        content: v.string(),
      }),
    ),
    placeholderMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    // Instantiate the OpenAI API client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: args.messages,
      stream: true,
    });

    // Update the placeholder message with the full response
    // as it comes in from the API
    let fullResponse = "";
    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta?.content;
      fullResponse += delta || "";
      await ctx.runMutation(internal.messages.update, {
        messageId: args.placeholderMessageId,
        content: fullResponse,
      });
    }
  },
});
