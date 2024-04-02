import { experimental_AssistantResponse } from "ai";
import OpenAI from "openai";
import { MessageContentText } from "openai/resources/beta/threads/messages/messages";
import { env } from "../../../../env.mjs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  threadId: z.string().or(z.undefined()),
  message: zfd.text(),
  file: z.instanceof(Blob).optional(),
});

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || "" });

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    console.log("POST request received");

    const input = await req.formData();
    const data = schema.parse(input);

    let openAiFile: OpenAI.Files.FileObject | null = null;
    if (data.file) {
      const file = new File([data.file], "file", { type: data.file.type });
      openAiFile = await openai.files.create({ file, purpose: "assistants" });
      console.log("File created", openAiFile);
    }

    const threadId = Boolean(data.threadId)
      ? data.threadId!
      : (await openai.beta.threads.create()).id;
    console.log("Thread ID:", threadId);

    const messageData = {
      role: "user" as "user",
      content: data.message,
      file_ids: openAiFile ? [openAiFile.id] : undefined,
    };

    const createdMessage = await openai.beta.threads.messages.create(
      threadId,
      messageData
    );
    console.log("Created message:", createdMessage);

    return experimental_AssistantResponse(
      { threadId, messageId: createdMessage.id },
      async ({ threadId, sendMessage, forwardStream }) => {
        console.log("Inside experimental_AssistantResponse");

        const runStream = openai.beta.threads.runs.stream(threadId, {
          assistant_id:
            env.OPENAI_ASSISTANT_ID ??
            (() => {
              throw new Error("ASSISTANT_ID is not set");
            })(),
        })
        .on('runStepDelta', (runStepDelta: any) => {
          if (runStepDelta.message && runStepDelta.message.content) {
            const message = runStepDelta.message;
            sendMessage({
              id: message.id,
              role: message.role as "assistant",
              content: message.content.filter(
                (content: any) => content.type === "text"
              ) as Array<MessageContentText>,
            });
          }
        });

        console.log("Run stream:", runStream);
        await forwardStream(runStream);
      }
    );
  } catch (error) {
    console.error("Error:", error);
    throw new Error("An error occurred while processing the request.");
  }
}