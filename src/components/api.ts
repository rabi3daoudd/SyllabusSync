import axios from "axios";
import { RRule, Frequency } from "rrule";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  googleEventId: string;
  calendarId: string;
  extendedProps: {
    description: string;
    location: string;
    recurrence: string[];
    isRecurring: boolean;
  };
}

interface RecurrenceOptions {
  frequency: keyof typeof Frequency;
  interval?: number;
  until?: Date;
  count?: number;
  byWeekday?: number[];
  byMonthDay?: number[];
}

// Get base URL from environment or determine dynamically
const getBaseUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For server-side (including chatbot tools)
  return process.env.BASE_URL || 'http://localhost:3000';
};

const baseUrl = getBaseUrl();

// Retry logic with exponential backoff
// async function retryRequest<T>(
//   requestFn: () => Promise<T>,
//   maxRetries: number = 3,
//   initialDelay: number = 1000
// ): Promise<T> {
//   let lastError: Error | null = null;
  
//   for (let attempt = 0; attempt < maxRetries; attempt++) {
//     try {
//       return await requestFn();
//     } catch (error) {
//       lastError = error as Error;
//       if (error instanceof AxiosError && error.response?.status === 429) {
//         const delay = initialDelay * Math.pow(2, attempt);
//         console.log(`Rate limited. Retrying in ${delay}ms...`);
//         await new Promise(resolve => setTimeout(resolve, delay));
//         continue;
//       }
//       throw error;
//     }
//   }
  
//   throw lastError;
// }

// Helper function to get auth headers
async function getAuthHeaders(uid: string) {
  try {
    // First, get a fresh access token using the stored refresh token
    const tokenResponse = await axios.post(`${baseUrl}/api/refresh-token`, { uid });
    const { access_token } = tokenResponse.data;

    return {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

// Gets all calendar events from every calendar and returns them as events
export const fetchAllEventsFromAllCalendars = async (
  uid: string
): Promise<CalendarEvent[]> => {
  console.log("Hit the fetch events with baseUrl:", baseUrl);

  try {
    const headers = await getAuthHeaders(uid);
    const calendarsResponse = await axios.get(
      `${baseUrl}/api/list-user-calendars?uid=${uid}`,
      { headers }
    );
    
    const calendars = calendarsResponse.data.items;
    let allEvents: CalendarEvent[] = [];

    for (const calendar of calendars) {
      const eventsResponse = await axios.get(
        `${baseUrl}/api/list-events?uid=${uid}&calendarId=${calendar.id || 'primary'}`,
        { headers }
      );

      const calendarEvents = eventsResponse.data.items || [];
      allEvents = [...allEvents, ...calendarEvents];
    }

    return allEvents;
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return [];
  }
};

export const createCalendarEvent = async (
  title: string,
  description: string,
  location: string,
  startDateTime: string,
  endDateTime: string,
  calendarId: string,
  uid: string
): Promise<{ id: string }> => {
  try {
    const headers = await getAuthHeaders(uid);
    const response = await axios.post(
      `${baseUrl}/api/create-event`,
      {
        summary: title,
        description,
        location,
        startDateTime,
        endDateTime,
        calendarId,
        uid,
      },
      { headers }
    );
    
    console.log("Event created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    throw error;
  }
};

export const deleteCalendarEvent = async (
  eventId: string,
  calendarId: string,
  uid: string
): Promise<void> => {
  try {
    console.log("Attempting to delete event:", { eventId, calendarId, uid });
    await axios.post(
      `${baseUrl}/api/delete-event`,
      {
        eventId,
        calendarId,
        uid,
      },
      {
        headers: {
          'Authorization': `Bearer ${uid}`,
          'Content-Type': 'application/json',
          'X-HTTP-Method-Override': 'DELETE',
        },
      }
    );
    console.log("Event deleted successfully");
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
    throw error;
  }
};

export const updateCalendarEvent = async (
  eventId: string,
  calendarId: string,
  summary: string,
  description: string,
  location: string,
  startDateTime: string,
  endDateTime: string,
  uid: string
): Promise<{ id: string }> => {
  try {
    const response = await axios.post(`${baseUrl}/api/update-event`, {
      eventId,
      calendarId,
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
      uid,
    }, {
      headers: {
        'Authorization': `Bearer ${uid}`,
        'Content-Type': 'application/json',
      }
    });
    console.log('Event updated successfully');
    return response.data;
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    throw error;
  }
};

export const createRecurringEvent = async (
  title: string,
  description: string,
  location: string,
  startDateTime: string,
  endDateTime: string,
  calendarId: string,
  uid: string,
  recurrenceOptions: RecurrenceOptions
): Promise<{ id: string }> => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Create RRULE without DTSTART
    const rruleOptions = {
      freq: Frequency[recurrenceOptions.frequency],
      interval: recurrenceOptions.interval || 1,
      ...(recurrenceOptions.until ? { until: recurrenceOptions.until } : {}),
      ...(recurrenceOptions.count ? { count: recurrenceOptions.count } : {}),
      ...(recurrenceOptions.byWeekday
        ? { byweekday: recurrenceOptions.byWeekday }
        : {}),
      ...(recurrenceOptions.byMonthDay
        ? { bymonthday: recurrenceOptions.byMonthDay }
        : {}),
    };

    const rule = new RRule(rruleOptions);
    // Get the RRULE string and remove any DTSTART if present
    const ruleString = rule
      .toString()
      .split("\n")
      .filter((line) => line.startsWith("RRULE:"))
      .join("");
    const recurrence = [ruleString];

    const response = await axios.post(`${baseUrl}/api/create-event`, {
      summary: title,
      description,
      location,
      startDateTime,
      endDateTime,
      calendarId,
      uid,
      recurrence,
      timeZone,
    });

    console.log("Recurring event created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to create recurring calendar event:", error);
    throw error;
  }
};

export const createTask = async (
  title: string,
  status: "todo" | "in progress" | "done",
  priority: "low" | "medium" | "high",
  uid: string,
  label?: string,
  dueDate?: string
): Promise<{ id: string }> => {
  try {
    const taskId = `TASK-${Date.now()}`;
    const newTask = {
      id: taskId,
      title,
      status,
      priority,
      ...(label ? { label } : {}),
      ...(dueDate ? { dueDate } : {}),
    };

    // Make an API call to a new endpoint that will handle the task creation
    const response = await fetch(`${baseUrl}/api/create-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${uid}`,
      },
      body: JSON.stringify(newTask),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    const data = await response.json();
    return { id: data.taskId };
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};
