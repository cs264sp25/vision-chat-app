import { createOpenAI } from "@ai-sdk/openai";
import { experimental_generateImage, streamText, tool } from "ai";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Infer, v } from "convex/values";
import { z } from "zod";

const DEBUG = true;

// Types ------------------------------------------------------------

const coreSystemMessageSchema = {
  role: v.literal("system"),
  content: v.string(),
};

const coreSystemMessageSchemaObject = v.object(coreSystemMessageSchema);
type CoreSystemMessage = Infer<typeof coreSystemMessageSchemaObject>;

const coreUserMessageSchema = {
  role: v.literal("user"),
  content: v.union(
    v.array(
      v.union(
        v.object({ type: v.literal("text"), text: v.string() }),
        v.object({ type: v.literal("image"), image: v.string() }),
        v.object({ type: v.literal("file"), data: v.string() }),
      ),
    ),
    v.string(),
  ),
};

const coreUserMessageSchemaObject = v.object(coreUserMessageSchema);
type CoreUserMessage = Infer<typeof coreUserMessageSchemaObject>;

const coreAssistantMessageSchema = {
  role: v.literal("assistant"),
  content: v.union(
    v.array(
      v.union(
        v.object({ type: v.literal("text"), text: v.string() }),
        v.object({ type: v.literal("image"), image: v.string() }),
        v.object({ type: v.literal("file"), data: v.string() }),
      ),
    ),
    v.string(),
  ),
};

const coreAssistantMessageSchemaObject = v.object(coreAssistantMessageSchema);
type CoreAssistantMessage = Infer<typeof coreAssistantMessageSchemaObject>;

const coreMessageSchema = v.union(
  coreSystemMessageSchemaObject,
  coreUserMessageSchemaObject,
  coreAssistantMessageSchemaObject,
);

// OpenAI ------------------------------------------------------------

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: "strict", // strict mode, enable when using the OpenAI API
});

// Actions ------------------------------------------------------------

export const generateImage = internalAction({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { image } = await experimental_generateImage({
      model: openai.image("dall-e-3"),
      prompt: args.prompt,
      n: 1,
    });

    if (DEBUG) {
      console.log("generateImage input prompt:", args.prompt);
    }

    const blob = new Blob([image.uint8Array], { type: image.mimeType });
    const storageId = await ctx.storage.store(blob);
    return (await ctx.storage.getUrl(storageId)) as string;
  },
});


export const completion = internalAction({
  args: {
    messages: v.array(coreMessageSchema),
    placeholderMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const instructions = [
      `You are a helpful assistant.`,
      `In case the user asks you to generate an image,`,
      `you should use the generateImage tool to generate an image.`,
      `The generateImage tool takes a prompt as an argument and returns an image URL.`,
      `You use the image URL in your response, formatted as a markdown image tag, to display the image to the user.`,
    ].join("\n");

    const { textStream } = streamText({
      model: openai("gpt-4o-mini"),
      tools: {
        generateImage: tool({
          description:
            "Given a prompt, generates an image and returns the image URL",
          parameters: z.object({
            prompt: z.string().describe("The prompt to generate an image"),
          }),
          execute: async ({ prompt }) => {
            await ctx.runMutation(internal.messages.update, {
              messageId: args.placeholderMessageId,
              content: `✨ Generating image... please wait! This may take a minute or two.`,
            });
            return ctx.runAction(internal.openai.generateImage, {
              prompt,
            });
          },
        }),
      },
      messages: [
        {
          role: "system",
          content: instructions,
        },
        // @ts-ignore
        ...args.messages,
      ],
      maxSteps: 10,
      temperature: 0,
      onStepFinish: ({
        // text,
        // reasoning,
        // sources,
        // toolCalls,
        // toolResults,
        // finishReason,
        // usage,
        // warnings,
        // logprobs,
        request,
        // response,
        // providerMetadata,
        // stepType,
        // isContinued,
      }) => {
        // console.log("Text", text);
        // console.log("Tool calls:", toolCalls);
        // console.log("Tool results:", toolResults);
        // console.log("Reasoning:", reasoning);
        // console.log("Sources:", sources);
        // console.log("Finish reason:", finishReason);
        // console.log("Usage:", usage);
        // console.log("Warnings:", warnings);
        // console.log("Logprobs:", logprobs);
        // console.log("Request:", request);
        // console.log("Response:", response);
        // console.log("Provider metadata:", providerMetadata);
        // console.log("Step type:", stepType);
        // console.log("Is continued:", isContinued);

        if (DEBUG) {
          // All the messages sent to AI at this point
          const body = JSON.parse(request.body || "{}");
          console.log("Request body:", body);
        }
      },
    });

    let fullResponse = "";
    for await (const delta of textStream) {
      fullResponse += delta;
      await ctx.runMutation(internal.messages.update, {
        messageId: args.placeholderMessageId,
        content: fullResponse,
      });
    }
  },
});
