import axios, { AxiosError } from "axios";
import { RRule, Frequency } from "rrule";

export interface CalendarEvent {
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
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      if (error instanceof AxiosError && error.response?.status === 429) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

// Gets all calendar events from every calendar and returns them as events
export const fetchAllEventsFromAllCalendars = async (
  uid: string
): Promise<CalendarEvent[]> => {
  console.log("Hit the fetch events with baseUrl:", baseUrl);

  const commonQueryParams = new URLSearchParams({ uid });
  let allEvents: CalendarEvent[] = [];

  try {
    // Use the Next.js API route for listing user calendars
    const calendarsResponse = await retryRequest(() => 
      axios.get(
        `${baseUrl}/api/list-user-calendars?${commonQueryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${uid}`,
          }
        }
      )
    );
    const calendars = calendarsResponse.data.items;

    for (const calendar of calendars) {
      const queryParams = new URLSearchParams(commonQueryParams);
      queryParams.set("calendarId", calendar.id || "primary");

      // Start of Selection
      // Use the Next.js API route for listing events
      interface ApiEvent {
        id: string;
        summary: string;
        description?: string;
        location?: string;
        start: {
          dateTime?: string;
          date?: string;
          timeZone?: string;
        };
        end: {
          dateTime?: string;
          date?: string;
          timeZone?: string;
        };
        recurrence?: string[];
      }

                const eventsResponse = await retryRequest(() =>
                  axios.get<{ items: ApiEvent[] }>(
                    `${baseUrl}/api/list-events?${queryParams}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${uid}`,
                      }
                    }
                  )
                );
                const calendarEvents = eventsResponse.data.items.flatMap(
                  (event: ApiEvent) => {
                    const baseEvent = {
                      id: event.id,
                      title: event.summary,
                      description: event.description || "",
                      location: event.location || "",
                      start: new Date(event.start.dateTime || event.start.date || ''),
                      end: new Date(event.end.dateTime || event.end.date || ''),
                      allDay: !event.start.dateTime,
                      googleEventId: event.id,
                      calendarId: calendar.id,
                      extendedProps: {
                        description: event.description || "",
                        location: event.location || "",
                        recurrence: event.recurrence || [],
                        isRecurring: Boolean(event.recurrence && event.recurrence.length > 0)
                      }
                    };
          
                    console.log('Transformed event:', {
                      title: baseEvent.title,
                      recurrence: event.recurrence,
                      isRecurring: Boolean(event.recurrence && event.recurrence.length > 0)
                    });
          
                    return [baseEvent];
                  }
                );

      allEvents = [...allEvents, ...calendarEvents];
    }
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    throw error;
  }
  return allEvents;
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
    const response = await retryRequest(() =>
      axios.post(`${baseUrl}/api/create-event`,
        {
          summary: title,
          description,
          location,
          startDateTime,
          endDateTime,
          calendarId,
          uid,
        },
        {
          headers: {
            'Authorization': `Bearer ${uid}`,
            'Content-Type': 'application/json',
          }
        }
      )
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
