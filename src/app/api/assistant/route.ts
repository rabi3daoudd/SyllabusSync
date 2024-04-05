import { experimental_AssistantResponse } from "ai";
import { OpenAI } from "openai";
import { TextContentBlock } from "openai/resources/beta/threads/messages/messages";
import { env } from "../../../../env.mjs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd
  .formData({
    threadId: z.string().or(z.undefined()),
    message: zfd.text().optional(),
    file: z.instanceof(Blob).optional(),
  })
  .refine((data) => data.message || data.file, {
    message: "Either message or file is required",
  });

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || "" });

export const runtime = "edge";

export async function POST(req: NextRequest) {
  // Parse the request body
  const input = await req.formData();
  const data = schema.parse(input);

  let openAiFile: OpenAI.Files.FileObject | null = null;

  if (data.file) {
    const file = new File([data.file], "file", { type: data.file.type });
    openAiFile = await openai.files.create({ file, purpose: "assistants" });
  }

  const threadId = data.threadId
    ? data.threadId
    : (await openai.beta.threads.create()).id;

  const messageData = {
    role: "user" as const,
    content: data.message ?? "",
    file_ids: openAiFile ? [openAiFile.id] : undefined,
  };

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(
    threadId,
    messageData
  );

  return experimental_AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ threadId, sendMessage, forwardStream }) => {

      // Run the assistant on the thread with streaming
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          env.OPENAI_ASSISTANT_ID ??
          (() => {
            throw new Error("ASSISTANT_ID is not set");
          })(),
      });

      // Forward the run stream to the client
      await forwardStream(runStream);

      // Get new thread messages (after our message)
      const responseMessages = (
        await openai.beta.threads.messages.list(threadId, {
          after: createdMessage.id,
          order: "asc",
        })
      ).data;

      // Send the messages
      // Send the messages
for (const message of responseMessages) {
    sendMessage({
      id: message.id,
      role: "assistant",
      content: message.content.filter(
        (content): content is TextContentBlock => content.type === "text"
      ) as TextContentBlock[],
    });
  }
    }
  );
}