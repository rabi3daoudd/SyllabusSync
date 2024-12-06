import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";
import { customModel } from "@/ai/index";
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent, createTask, fetchAllEventsFromAllCalendars } from "@/components/api";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  console.log(request)
  return new Response('Vercel', {
    status:200,
  })
}

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

  const languageInstructions = {
    en: 'All your responses should be in English.',
    es: 'Todas tus respuestas deben estar en Español.',
    fr: 'Toutes vos réponses doivent être en Français.',
    de: 'Alle deine Antworten sollten auf Deutsch sein.',
    it: 'Le tue risposte dovrebbero essere in Italiano.',
    zh: '你的所有回复都应该用中文。',
    ja: 'あなたのすべての回答は日本語である必要があります。',
    ru: 'Все ваши ответы должны быть на русском языке.',
    ar: 'يجب أن تكون جميع إجاباتك باللغة العربية.',
    pt: 'Todas as suas respostas devem ser em Português.',
    hi: 'आपके सभी उत्तर हिंदी में होने चाहिए।',
    ko: '모든 답변은 한국어로 작성해야 합니다.',
    tr: 'Tüm yanıtlarınız Türkçe olmalıdır.',
    nl: 'Al je antwoorden moeten in het Nederlands zijn.',
    pl: 'Wszystkie twoje odpowiedzi powinny być po polsku.',
    sv: 'Alla dina svar ska vara på Svenska.',
    // Add more languages as needed
  }


  // Define the type for the language keys
  type LanguageKey = keyof typeof languageInstructions;

  // Extract messages, language, calendarId and more from the request body
  const {
    messages,
    language,
    fileContents,
  }: {
    messages: Array<Message>;
    language: LanguageKey;
    fileContents: string[];
  } = await request.json();

  const syllabusText = fileContents ? fileContents.join("\n") : "";
  


  const coreMessages = convertToCoreMessages(messages);
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error("Base URL is not defined in environment variables.");
  }

  // Get the language instruction or default to English
  const languageInstruction =
      languageInstructions[language] || languageInstructions['en'];
  
  const systemPromptTemplate = `${languageInstruction}

You are SyllabusSync, an AI assistant specialized in helping university students manage their academic schedules. Your primary function is to extract key dates from course syllabi and integrate them with Google Calendar. Follow these instructions carefully to assist students effectively.

To begin, you will be provided with the full text of a course syllabus and, if available, information about the user's existing commitments. Analyze this information thoroughly:
<syllabus>
{{SYLLABUS_TEXT}}
</syllabus>
<user_id>
${uid}
</user_id>
Your task is to extract all relevant academic dates and events from the syllabus, create a study schedule, and prepare this information for integration with Google Calendar. Follow these steps:
1. Syllabus Analysis and Date Extraction:
   - Read the entire syllabus text.
   - Extract all relevant academic dates and events, including:
     * Assignment deadlines
     * Exam dates
     * Project due dates
     * Recurring lecture and lab times
     * Office hours
     * Any other critical academic events
2. Information Presentation:
   Present the extracted information in a clear, organized format using bullet points. For each item, include:
   - Event type (e.g., assignment, exam, lecture)
   - Date and time (if specified)
   - Description or title of the event
   - Weight or importance (if mentioned in the syllabus)
   Example format:
   • Event Type: [Type]
     Date: [YYYY-MM-DD]
     Time: [HH:MM] (if applicable)
     Description: [Brief description]
     Weight: [If specified]
   For any dates or events marked as TBD (To Be Determined) in the syllabus, clearly indicate this in your presentation.
3. User Confirmation and Input:
   After presenting the extracted information, ask the user to confirm the accuracy of the dates and events. Invite them to add any additional dates or modify existing ones if necessary.
4. Google Calendar Integration:
   Never schedule anything before showing the user what you are going to schedule and getting their confirmation.
   Once the user has confirmed the dates, prepare the information for Google Calendar integration using this format:
   <calendar_api_call>
   Action: [ADD_EVENT/UPDATE_EVENT/DELETE_EVENT]
   Event_Id: [Event ID if updating or deleting]
   Event_Title: [Title of the event]
   Start_Date: [YYYY-MM-DD]
   Start_Time: [HH:MM] (if applicable)
   End_Date: [YYYY-MM-DD]
   End_Time: [HH:MM] (if applicable)
   Description: [Brief description of the event]
   </calendar_api_call>
   Ensure that you are using the primary calendar to put the events in
5. Study Session Creation:
   Based on the extracted dates and user's existing commitments (if provided), create a study schedule following these guidelines:
   - Allocate more study time for subjects with higher weightage or upcoming deadlines
   - Space out study sessions to avoid cramming
   - Consider the user's existing commitments
   - Create study events in Google Calendar using the API call format above
6. Final Confirmation:
   Present a summary to the user for final approval, including:
   - A list of all events to be added to their Google Calendar
   - An overview of the study schedule created
   - Any TBD items that still need attention
Throughout the interaction:
- Maintain a supportive and empathetic tone. Acknowledge the challenges of academic life and offer encouragement.
- Prioritize user privacy. Do not share or store any personal or academic information outside of the immediate interaction.
- If you need any clarification or additional information from the user, ask politely and clearly.
- If you need to know the current date or time, use the {getCurrentDate} tool. This is needed when the user asks for events they have the day of.
- If you need to create, update, or delete events for the user, use the appropriate tool ({createCalendarEvent}, {updateCalendarEvent}, or {deleteCalendarEvent}). Then respond saying it worked!
After completing these steps, thank the user for using SyllabusSync and invite them to reach out if they need any further assistance or modifications to their schedule.
Remember to wrap your thought process in <analysis> tags to show your reasoning process for complex decisions or analyses throughout the task. In your analysis:
1. Identify and list all types of events mentioned in the syllabus.
2. Note any potential conflicts or overlaps between syllabus events and existing user commitments.
3. Prioritize events based on their importance or weight.
You can also help users manage their tasks:
1. Create tasks for assignments, projects, or study sessions using the {createTask} tool
2. Set appropriate priorities (low, medium, high) based on due dates and importance
3. Add class labels to tasks to organize them by course
4. Set due dates to help users track deadlines
5. Set initial status as "todo" for new tasks
`;

if (syllabusText.length > 20000) {
  // If the text is too long, summarize it
  // finalSyllabusText = await summarizeText(syllabusText);
  console.log('Syl text is TOO long')
}

const systemPrompt = systemPromptTemplate.replace("{{SYLLABUS_TEXT}}", syllabusText);

  const result = await streamText({
    model: customModel,
    system: systemPrompt,
    messages: coreMessages,
    maxSteps: 50,
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
        description: "Fetches all events from all calendars for a specific user",
        parameters: z.object({
          uid: z.string().describe("The user ID"),
        }),
        execute: async ({ uid: requestedUid }) => {
          try {
            return await fetchAllEventsFromAllCalendars(requestedUid);
          } catch (error) {
            console.error("Error in getCalendarEvents tool:", error);
            throw error;
          }
        },
      },
      getCurrentDate: {
        description: "Get the current date and time in ISO format",
        parameters: z.object({}),
        execute: async () => {
          const currentDate = new Date().toISOString();
          return { currentDate };
        },
      },
      createCalendarEvent: {
        description: "Creates an event in the user's Google Calendar",
        parameters: z.object({
          uid: z.string().describe("The user ID"),
          calendarId: z.string().describe("The calendar ID"),
          summary: z.string().describe("Event summary or title"),
          description: z.string().optional().describe("Event description"),
          location: z.string().optional().describe("Event location"),
          startDateTime: z.string().describe("Event start date and time in ISO format"),
          endDateTime: z.string().describe("Event end date and time in ISO format"),
        }),
        execute: async (args) => {
          try {
            const {
              uid: requestedUid,
              calendarId,
              summary,
              description = "",
              location = "",
              startDateTime,
              endDateTime,
            } = args;
  
            // Use the createCalendarEvent function
            await createCalendarEvent(
              summary,
              description,
              location,
              startDateTime,
              endDateTime,
              calendarId,
              requestedUid
            );
  
            return { success: true, message: "Event created successfully." };
          } catch (error) {
            console.error("Error in createCalendarEvent tool:", error);
            throw error;
          }
        },
      },
      updateCalendarEvent: {
        description: "Updates an event in the user's Google Calendar",
        parameters: z.object({
          uid: z.string().describe("The user ID"),
          calendarId: z.string().describe("The calendar ID"),
          eventId: z.string().describe("The event ID"),
          summary: z.string().describe("Event summary or title"),
          description: z
            .string()
            .optional()
            .describe("Event description"),
          location: z.string().optional().describe("Event location"),
          startDateTime: z
            .string()
            .describe("Event start date and time in ISO format"),
          endDateTime: z
            .string()
            .describe("Event end date and time in ISO format"),
        }),
        execute: async (args) => {
          try {
            const {
              uid: requestedUid,
              calendarId,
              eventId,
              summary,
              description = "",
              location = "",
              startDateTime,
              endDateTime,
            } = args;

            // Use the updateCalendarEvent function
            const response = await updateCalendarEvent(
              eventId,
              calendarId,
              summary,
              description,
              location,
              startDateTime,
              endDateTime,
              requestedUid
            );

            return {
              success: true,
              message: "Event updated successfully.",
              id: response.id,
            };
          } catch (error) {
            console.error("Error in updateCalendarEvent tool:", error);
            throw error;
          }
        },
      },
      deleteCalendarEvent: {
        description: "Deletes an event from the user's Google Calendar",
        parameters: z.object({
          uid: z.string().describe("The user ID"),
          calendarId: z.string().describe("The calendar ID"),
          eventId: z.string().describe("The event ID"),
        }),
        execute: async ({ uid: requestedUid, calendarId, eventId }) => {
          try {
            // Use the deleteCalendarEvent function
            await deleteCalendarEvent(eventId, calendarId, requestedUid);
            return { success: true, message: "Event deleted successfully." };
          } catch (error) {
            console.error("Error in deleteCalendarEvent tool:", error);
            throw error;
          }
        },
      },
      createTask: {
        description: "Creates a task for the user",
        parameters: z.object({
          uid: z.string().describe("The user ID"),
          title: z.string().describe("Task title"),
          status: z.string().describe("Task status (todo, in progress, done)"),
          priority: z.string().describe("Task priority (low, medium, high)"),
          label: z.string().optional().describe("Task label (class name)"),
          dueDate: z.string().optional().describe("Due date in ISO format"),
        }),
        execute: async ({ uid: requestedUid, title, status, priority, label, dueDate }) => {
          try {
            // Verify the user is authenticated via the Bearer token
            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
              throw new Error("Unauthorized");
            }
            const tokenUid = authHeader.split("Bearer ")[1];
            
            // Verify the requested UID matches the token UID
            if (tokenUid !== requestedUid) {
              throw new Error("User ID mismatch");
            }

            const result = await createTask(
              title,
              status as "todo" | "in progress" | "done",
              priority as "low" | "medium" | "high",
              requestedUid,
              label,
              dueDate
            );
            return { success: true, message: "Task created successfully.", taskId: result.id };
          } catch (error) {
            console.error("Error in createTask tool:", error);
            throw error;
          }
        },
      },
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
    onStepFinish: ({
      text,
      toolCalls,
      toolResults,
      finishReason,
      usage,
    }) => {
      // Log tool calls
      if (text && text.trim() !== "") {
        sendMessageToUser({
          role: "assistant",
          content: text,
          id: "",
        });
      } else if (finishReason === "tool-calls" && !text) {
        // If no text was generated and a tool is about to be called, inform the user
        sendMessageToUser({
          role: "assistant",
          content: "Currently processing your request...",
          id: "",
        });
      }
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
