import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";
import { customModel } from "@/ai/index";
import { fetchAllEventsFromAllCalendars } from "@/components/api";

export async function POST(request: Request) {
  // Get the Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Extract the UID from the Bearer token
  const uid = authHeader.split("Bearer ")[1];
  if (!uid) {
    return new Response("Invalid authorization token", { status: 401 });
  }

  const {
    messages,
  }: { messages: Array<Message>; calendarId: string } = await request.json();

  const coreMessages = convertToCoreMessages(messages);
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error("Base URL is not defined in environment variables.");
  }

  const result = await streamText({
    model: customModel,
    system: `You are SyllabusSync, an AI assistant specialized in helping university students manage their academic schedules...`,
    messages: coreMessages,
    maxSteps: 15,
    tools: {
      getWeather: {
        description: "Get the current weather at a location",
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        execute: async ({ latitude, longitude }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
          );

          const weatherData = await response.json();
          return weatherData;
        },
      },
      getCalendarEvents: {
        description:
          "Fetches all events from all calendars for a specific user",
        parameters: z.object({
          uid: z.string().describe("The user ID"),
        }),
        execute: async ({ uid: requestedUid }) => {
          try {
            // Fetch all events from all calendars
            const allEvents = await fetchAllEventsFromAllCalendars(
              requestedUid,
            );
            return allEvents;
          } catch (error) {
            console.error("Error in getCalendarEvents tool:", error);
            throw error;
          }
        },
      },
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
    onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
      // Log tool calls
      if (toolCalls?.length) {
        toolCalls.forEach((toolCall) => {
          const toolNotification: Message = {
            role: "system",
            content: `🔧 **Tool Called:** ${
              toolCall.toolName
            }\n**Arguments:** ${JSON.stringify(toolCall.args, null, 2)}`,
            id: "",
          };
          sendMessageToUser(toolNotification);
        });
      }

      // Log tool results
      if (toolResults?.length) {
        toolResults.forEach((toolResult) => {
          const toolResultMessage: Message = {
            role: "system",
            content: `✅ **Tool Completed:** ${toolResult.toolName}`,
            id: "",
          };
          sendMessageToUser(toolResultMessage);
        });
      }

      // Log debugging information
      console.log("--- Step Finished ---");
      console.log("Generated Text:", text);
      console.log("Finish Reason:", finishReason);
      console.log("Usage:", usage);
    },
  });

  return result.toDataStreamResponse({});
}

function sendMessageToUser(message: Message) {
  // Implement based on your application's architecture
  console.log("Sending message to user:", message.content);
}