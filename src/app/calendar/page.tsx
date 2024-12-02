"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  EventDragStopArg,
  EventResizeDoneArg,
} from "@fullcalendar/interaction";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import rrulePlugin from "@fullcalendar/rrule";
import { Frequency } from "rrule";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/firebase-config";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  MapPin,
  Pencil,
  Trash2,
  ExternalLink,
  Repeat,
  RefreshCcw,
  PlusCircle,
  Clock,
  Loader2,
} from "lucide-react";
import "@/styles/calendar.css";
import { format } from "date-fns";
import { useInterval } from "@/hooks/use-inerval";
import { DatePickerWithPresets } from "@/components/calendar/DatePicker";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  createRecurringEvent,
  fetchAllEventsFromAllCalendars,
} from "@/components/api";

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
  recurrence?: string[];
  extendedProps?: {
    isRecurring?: boolean;
  };
}
interface EventContentArg {
  event: {
    title: string;
    extendedProps: {
      location?: string;
      description?: string;
      recurrence?: string[];
      isRecurring: boolean;
    };
  };
  timeText: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    startHour: "12",
    startMinute: "00",
    startAmPm: "AM",
    endDate: new Date(),
    endHour: "12",
    endMinute: "00",
    endAmPm: "PM",
    isRecurring: false,
    recurrenceFrequency: "DAILY" as keyof typeof Frequency,
    recurrenceInterval: 1,
    recurrenceCount: 1 as number | undefined,
    recurrenceUntil: undefined as Date | undefined,
  });
  const [calendarView] = useState("timeGridWeek");
  const calendarRef = useRef<FullCalendar>(null);
  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  // New State for Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null
  );

  // Add loading state
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleStartDateChange = (date: Date) => {
    console.log("Start Date Changed:", date); // Debugging line
    setNewEvent({ ...newEvent, startDate: date });
  };

  const handleEndDateChange = (date: Date) => {
    console.log("End Date Changed:", date); // Debugging line
    setNewEvent({ ...newEvent, endDate: date });
  };

  const handleDropdownChange = (name: string, value: string) => {
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleSelect = useCallback((selectInfo: DateSelectArg) => {
    const { start, end } = selectInfo;
    setNewEvent((prev) => ({
      ...prev,
      title: "",
      description: "",
      startDate: start,
      startHour: format(start, "h"),
      startMinute: format(start, "mm"),
      startAmPm: format(start, "a").toUpperCase(),
      endDate: end,
      endHour: format(end, "h"),
      endMinute: format(end, "mm"),
      endAmPm: format(end, "a").toUpperCase(),
      isRecurring: false,
      recurrenceCount: 1,
      recurrenceUntil: undefined,
    }));
    setIsAddModalOpen(true);
    setSelectInfo(selectInfo);
  }, []);

  const cleanupAfterEventCreation = useCallback(() => {
    if (selectInfo) {
      selectInfo.view.calendar.unselect();
    }
    setSelectInfo(null);
    setIsAddModalOpen(false);
  }, [selectInfo]);

  const handleAddEvent = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAddingEvent(true);

      const {
        title,
        description,
        startDate,
        startHour,
        startMinute,
        startAmPm,
        endDate,
        endHour,
        endMinute,
        endAmPm,
        isRecurring,
        recurrenceFrequency,
        recurrenceInterval,
        recurrenceCount,
        recurrenceUntil,
      } = newEvent;

      if (!title || !startDate || !endDate) {
        toast({
          title: "Validation Error",
          description: "Title, start date, and end date are required",
          variant: "destructive",
        });
        setIsAddingEvent(false);
        return;
      }

      const start = new Date(startDate);
      start.setHours(
        parseInt(startHour) +
          (startAmPm === "PM" && startHour !== "12" ? 12 : 0),
        parseInt(startMinute)
      );

      const end = new Date(endDate);
      end.setHours(
        parseInt(endHour) + (endAmPm === "PM" && endHour !== "12" ? 12 : 0),
        parseInt(endMinute)
      );

      try {
        const user = auth.currentUser;
        if (user) {
          let createdEvent;

          if (isRecurring) {
            createdEvent = await createRecurringEvent(
              title.trim(),
              description,
              "",
              start.toISOString(),
              end.toISOString(),
              "primary",
              user.uid,
              {
                frequency: recurrenceFrequency,
                interval: recurrenceInterval,
                count: recurrenceCount,
                until: recurrenceUntil,
              }
            );
          } else {
            createdEvent = await createCalendarEvent(
              title.trim(),
              description,
              "",
              start.toISOString(),
              end.toISOString(),
              "primary",
              user.uid
            );
          }

          if (!createdEvent.id) {
            throw new Error("Event ID is missing from the creation response.");
          }

          // Refresh events after creation
          const updatedEvents = await fetchAllEventsFromAllCalendars(user.uid);
          setEvents(updatedEvents);

          cleanupAfterEventCreation();
          toast({
            title: "Event Created",
            description: isRecurring
              ? "Your recurring event has been successfully created."
              : "Your event has been successfully created.",
          });
        }
      } catch (error) {
        console.error("Error in creating calendar event:", error);
        toast({
          title: "Error",
          description: "Failed to create event. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAddingEvent(false);
      }
    },
    [newEvent, cleanupAfterEventCreation, toast]
  );

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event: CalendarEvent = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      description: clickInfo.event.extendedProps.description || "",
      location: clickInfo.event.extendedProps.location || "",
      start: clickInfo.event.start || new Date(),
      end: clickInfo.event.end || new Date(),
      allDay: clickInfo.event.allDay,
      googleEventId: clickInfo.event.extendedProps.googleEventId,
      calendarId: clickInfo.event.extendedProps.calendarId,
      recurrence: clickInfo.event.extendedProps.recurrence,
    };
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  }, []);

  // Modified handleDeleteEvent to open confirmation dialog
  const handleDeleteEvent = useCallback(() => {
    if (selectedEvent) {
      setEventToDelete(selectedEvent);
      setIsDeleteConfirmOpen(true);
    }
  }, [selectedEvent]);

  const confirmDeleteEvent = useCallback(async () => {
    if (eventToDelete) {
      try {
        const user = auth.currentUser;
        console.log("Attempting to delete event:", {
          googleEventId: eventToDelete.googleEventId,
          calendarId: eventToDelete.calendarId,
          uid: user?.uid,
        });
        if (user && eventToDelete.googleEventId && eventToDelete.calendarId) {
          await deleteCalendarEvent(
            eventToDelete.googleEventId,
            eventToDelete.calendarId,
            user.uid
          );
          console.log("Event deleted, updating local state");
          setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
          toast({
            title: "Event Deleted",
            description: "Your event has been successfully deleted.",
          });
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        toast({
          title: "Error",
          description: "Failed to delete event. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsDeleteConfirmOpen(false);
        setEventToDelete(null);
        setIsViewModalOpen(false);
        setSelectedEvent(null);
      }
    }
  }, [eventToDelete, toast]);

  const fetchEvents = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      console.log("Syncing calendar events...");
      const fetchedEvents = await fetchAllEventsFromAllCalendars(user.uid);

      setEvents(fetchedEvents);
      setLastSync(new Date());
    } catch (error) {
      console.error("Error syncing calendar events:", error);
    }
  }, []);

  useInterval(fetchEvents, 60000);

  const handleManualRefresh = () => {
    fetchEvents();
    toast({
      title: "Refreshing Events",
      description: "Fetching the latest events.",
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        console.log("Authenticated user found, fetching events...");
        const fetchedEvents = await fetchAllEventsFromAllCalendars(user.uid);
        setEvents(fetchedEvents);
      } else {
        console.log("No authenticated user found");
        setEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (eventToEdit) {
      setEventToEdit({ ...eventToEdit, [name]: value });
    }
  };

  const handleSubmitEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventToEdit) {
      // Validate required fields
      if (!eventToEdit.title || !eventToEdit.start || !eventToEdit.end) {
        toast({
          title: "Validation Error",
          description: "Title, start date, and end date are required.",
          variant: "destructive",
        });
        return;
      }

      try {
        await updateCalendarEvent(
          eventToEdit.googleEventId,
          eventToEdit.calendarId || "primary",
          eventToEdit.title.trim(),
          eventToEdit.description || "",
          eventToEdit.location || "",
          eventToEdit.start.toISOString(),
          eventToEdit.end.toISOString(),
          auth.currentUser!.uid
        );
        toast({
          title: "Event Updated",
          description: "Your event has been successfully updated.",
        });
        await fetchEvents(); // Refresh events to reflect changes
        setIsEditModalOpen(false);
        setEventToEdit(null);
      } catch (error) {
        console.error("Error updating event:", error);
        toast({
          title: "Error",
          description: "Failed to update event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handler for when an event is dragged and dropped to a new time
  const handleEventDrop = useCallback(
    async (dropInfo: EventDragStopArg) => {
      const event = dropInfo.event;
      const updatedEvent: CalendarEvent = {
        id: event.id,
        title: event.title,
        description: event.extendedProps.description || "",
        location: event.extendedProps.location || "",
        start: event.start || new Date(),
        end: event.end || new Date(),
        googleEventId: event.id,
        calendarId: event.extendedProps.calendarId || "primary",
      };

      // Since `revert` is not available, you cannot programmatically revert the drop.
      // You may need to implement alternative error handling or notify the user accordingly.

      if (!updatedEvent.googleEventId) {
        console.error("Missing googleEventId for event:", updatedEvent);
        alert("Failed to identify the event. Please try again.");
        // dropInfo.revert(); // Cannot use `revert` here
        return;
      }

      try {
        await updateCalendarEvent(
          updatedEvent.googleEventId!,
          updatedEvent.calendarId || "primary",
          updatedEvent.title,
          updatedEvent.description || "",
          updatedEvent.location || "",
          updatedEvent.start.toISOString(),
          updatedEvent.end.toISOString(),
          auth.currentUser!.uid
        );
        console.log("Event time updated successfully");
        fetchEvents(); // Refresh events
        toast({
          title: "Event Rescheduled",
          description: "Your event has been moved to the new time.",
        });
      } catch (error) {
        console.error("Error updating event time:", error);
        toast({
          title: "Error",
          description: "Failed to reschedule event. Please try again.",
          variant: "destructive",
        });
        // dropInfo.revert(); // Cannot use `revert` here
      }
    },
    [fetchEvents, toast]
  );

  // Handler for when an event is resized
  const handleEventResize = useCallback(
    async (resizeInfo: EventResizeDoneArg) => {
      const event = resizeInfo.event;
      const updatedEvent: CalendarEvent = {
        id: event.id, // googleEventId
        title: event.title,
        description: event.extendedProps.description || "",
        location: event.extendedProps.location || "",
        start: event.start || new Date(),
        end: event.end || new Date(),
        googleEventId: event.id, // Assuming id and googleEventId are the same
        calendarId: event.extendedProps.calendarId || "primary",
      };

      try {
        await updateCalendarEvent(
          updatedEvent.googleEventId!,
          updatedEvent.calendarId || "primary",
          updatedEvent.title,
          updatedEvent.description || "",
          updatedEvent.location || "",
          updatedEvent.start.toISOString(),
          updatedEvent.end.toISOString(),
          auth.currentUser!.uid
        );
        console.log("Event duration updated successfully");
        fetchEvents(); // Refresh events
        toast({
          title: "Event Duration Updated",
          description:
            "The duration of your event has been successfully updated.",
        });
      } catch (error) {
        console.error("Error updating event duration:", error);
        toast({
          title: "Error",
          description: "Failed to update event duration. Please try again.",
          variant: "destructive",
        });
        resizeInfo.revert();
      }
    },
    [fetchEvents]
  );

  const openEditModal = useCallback(() => {
    if (selectedEvent) {
      setEventToEdit(selectedEvent);
      setIsEditModalOpen(true);
      setIsViewModalOpen(false); // Close the View modal
    }
  }, [selectedEvent]);

  // Transform events for calendar display
  const transformedEvents = useMemo(() => {
    return events.map(event => {
        const hasRecurrence = event.recurrence && event.recurrence.length > 0;
        console.log('Processing event:', {
            title: event.title,
            recurrence: event.recurrence,
            hasRecurrence,
            extendedProps: {
                isRecurring: hasRecurrence
            }
        });
        
        return {
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            extendedProps: {
                googleEventId: event.googleEventId,
                calendarId: event.calendarId,
                description: event.description,
                location: event.location,
                isRecurring: hasRecurrence,
                recurrence: event.recurrence
            }
        };
    });
}, [events]);

  return (
    <div className="w-full h-screen flex flex-col p-4">
      <div className="flex justify-between items-center p-4 bg-background border-b">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Last synced: {lastSync.toLocaleTimeString()}
          </p>
          <Button onClick={handleManualRefresh} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>
      <div className="flex-grow w-full h-[calc(100vh-80px)]">
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            scrollGridPlugin,
            rrulePlugin,
          ]}
          initialView={calendarView}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          views={{
            timeGridWeek: {
              titleFormat: {
                month: "long",
                year: "numeric",
              },
            },
            timeGridDay: {
              titleFormat: {
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            },
            dayGridMonth: {
              titleFormat: {
                month: "long",
                year: "numeric",
              },
            },
          }}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={transformedEvents}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          select={handleSelect}
          height="auto"
          eventDisplay="block"
          slotDuration="00:30:00"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          nowIndicator={true}
          scrollTime={format(new Date(), "H") + ":00:00"}
          dayMinWidth={200}
          expandRows={false}
          stickyHeaderDates={true}
          eventBackgroundColor="hsl(var(--primary))"
          eventBorderColor="hsl(var(--primary))"
          eventClassNames="calendar-event"
          dayHeaderContent={(args) => ({
            html: `<div class="fc-day-header">
                     <div class="fc-day-name">${format(
                       args.date,
                       "EEE"
                     ).toUpperCase()}</div>
                     <div class="fc-day-number">${format(args.date, "d")}</div>
                   </div>`,
          })}
          eventMinHeight={20}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </div>

      {/* Add Event Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) cleanupAfterEventCreation();
          setIsAddModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Enter the details for your new event.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            {/* Title Field (Mandatory) */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-600">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                placeholder="Event Title"
                required
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={newEvent.description}
                onChange={handleInputChange}
                placeholder="Event Description"
              />
            </div>

            {/* Start Date and Time (Mandatory) */}
            <div className="space-y-2">
              <Label>
                Start Date & Time <span className="text-red-600">*</span>
              </Label>
              <div className="flex space-x-2">
                <DatePickerWithPresets
                  date={newEvent.startDate}
                  onChange={(date) => {
                    if (date) {
                      console.log(
                        "DatePickerWithPresets Start Date Change:",
                        date
                      );
                      handleStartDateChange(date);
                    }
                  }}
                />
                {/* Start Time Selects */}
                <select
                  name="startHour"
                  value={newEvent.startHour}
                  onChange={(e) =>
                    handleDropdownChange("startHour", e.target.value)
                  }
                  required
                  className="w-1/4 border rounded p-2"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                :
                <select
                  name="startMinute"
                  value={newEvent.startMinute}
                  onChange={(e) =>
                    handleDropdownChange("startMinute", e.target.value)
                  }
                  required
                  className="w-1/4 border rounded p-2"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  name="startAmPm"
                  value={newEvent.startAmPm}
                  onChange={(e) =>
                    handleDropdownChange("startAmPm", e.target.value)
                  }
                  required
                  className="w-1/4 border rounded p-2"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* End Date and Time (Mandatory) */}
            <div className="space-y-2">
              <Label>
                End Date & Time <span className="text-red-600">*</span>
              </Label>
              <div className="flex space-x-2">
                <DatePickerWithPresets
                  date={newEvent.endDate}
                  onChange={(date) => {
                    if (date) {
                      console.log(
                        "DatePickerWithPresets End Date Change:",
                        date
                      );
                      handleEndDateChange(date);
                    }
                  }}
                />
                {/* End Time Selects */}
                <select
                  name="endHour"
                  value={newEvent.endHour}
                  onChange={(e) =>
                    handleDropdownChange("endHour", e.target.value)
                  }
                  required
                  className="w-1/4 border rounded p-2"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                :
                <select
                  name="endMinute"
                  value={newEvent.endMinute}
                  onChange={(e) =>
                    handleDropdownChange("endMinute", e.target.value)
                  }
                  required
                  className="w-1/4 border rounded p-2"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  name="endAmPm"
                  value={newEvent.endAmPm}
                  onChange={(e) =>
                    handleDropdownChange("endAmPm", e.target.value)
                  }
                  required
                  className="w-1/4 border rounded p-2"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="isRecurring">Recurring Event</Label>
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newEvent.isRecurring}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, isRecurring: e.target.checked })
                  }
                  className="h-4 w-4"
                />
              </div>

              {newEvent.isRecurring && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceFrequency">Frequency</Label>
                      <select
                        id="recurrenceFrequency"
                        value={newEvent.recurrenceFrequency}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            recurrenceFrequency: e.target
                              .value as keyof typeof Frequency,
                          })
                        }
                        className="w-full rounded-md border p-2"
                      >
                        {Object.keys(Frequency)
                          .filter((k) => isNaN(Number(k)))
                          .map((freq) => (
                            <option key={freq} value={freq}>
                              {freq.charAt(0) + freq.slice(1).toLowerCase()}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurrenceInterval">Interval</Label>
                      <Input
                        id="recurrenceInterval"
                        type="number"
                        min="1"
                        value={newEvent.recurrenceInterval}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            recurrenceInterval: Math.max(
                              1,
                              parseInt(e.target.value) || 1
                            ),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceCount">
                        Number of Occurrences
                      </Label>
                      <Input
                        id="recurrenceCount"
                        type="number"
                        min="1"
                        value={newEvent.recurrenceCount || ""}
                        onChange={(e) => {
                          const count = e.target.value
                            ? parseInt(e.target.value)
                            : undefined;
                          setNewEvent({
                            ...newEvent,
                            recurrenceCount: count,
                            recurrenceUntil: undefined,
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurrenceUntil">End Date</Label>
                      <DatePickerWithPresets
                        date={newEvent.recurrenceUntil || newEvent.endDate}
                        onChange={(date) =>
                          setNewEvent({
                            ...newEvent,
                            recurrenceUntil: date,
                            recurrenceCount: undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isAddingEvent}>
              {isAddingEvent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                "Add Event"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Event Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="absolute right-12 top-[6px] flex items-center gap-1">
            <button
              className="h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center"
              onClick={() => {
                openEditModal();
              }}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </button>
            <button
              className="h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center"
              onClick={() => {
                handleDeleteEvent();
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </button>
            <button
              className="h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center"
              onClick={() => {
                if (selectedEvent?.googleEventId && selectedEvent?.calendarId) {
                  const eid = btoa(
                    `${selectedEvent.googleEventId} ${selectedEvent.calendarId}`
                  );
                  window.open(
                    `https://calendar.google.com/calendar/event?eid=${eid}`,
                    "_blank"
                  );
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open in Google Calendar</span>
            </button>
          </div>
          <div className="pt-6">
            <DialogTitle className="text-lg font-semibold">
              {selectedEvent?.title}
            </DialogTitle>
            <div className="space-y-4 mt-4">
              {selectedEvent?.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
              {selectedEvent?.location && (
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    {selectedEvent.location}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Clock className="h-4 w-4 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  {format(selectedEvent?.start || new Date(), "PPP")}{" "}
                  {format(selectedEvent?.start || new Date(), "p")}
                  {" - "}
                  {format(selectedEvent?.end || new Date(), "p")}
                </div>
              </div>
              {selectedEvent?.recurrence &&
                Array.isArray(selectedEvent.recurrence) &&
                selectedEvent.recurrence.length > 0 && (
                  <div className="flex gap-2">
                    <Repeat className="h-4 w-4 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      This is a recurring event
                    </span>
                  </div>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Modify the details of your event.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditEvent} className="space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Title <span className="text-red-600">*</span>
              </Label>
              <Input
                id="edit-title"
                name="title"
                value={eventToEdit?.title || ""}
                onChange={handleEditInputChange}
                placeholder="Event Title"
                required
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                name="description"
                value={eventToEdit?.description || ""}
                onChange={handleEditInputChange}
                placeholder="Event Description"
              />
            </div>

            {/* Location Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                name="location"
                value={eventToEdit?.location || ""}
                onChange={handleEditInputChange}
                placeholder="Event Location"
              />
            </div>

            {/* Start Date and Time */}
            <div className="space-y-2">
              <Label>
                Start Date & Time <span className="text-red-600">*</span>
              </Label>
              <div className="flex space-x-2">
                <DatePickerWithPresets
                  date={eventToEdit?.start || new Date()}
                  onChange={(date) => {
                    if (date && eventToEdit) {
                      setEventToEdit({ ...eventToEdit, start: date });
                    }
                  }}
                />
                {/* Start Time Selects */}
                <select
                  name="startHour"
                  value={format(eventToEdit?.start || new Date(), "h")}
                  onChange={(e) => {
                    if (eventToEdit) {
                      const updatedDate = new Date(eventToEdit.start);
                      updatedDate.setHours(
                        parseInt(e.target.value) +
                          (format(eventToEdit.start, "a").toUpperCase() === "PM"
                            ? 12
                            : 0)
                      );
                      setEventToEdit({ ...eventToEdit, start: updatedDate });
                    }
                  }}
                  required
                  className="w-1/4 border rounded p-2"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                :
                <select
                  name="startMinute"
                  value={format(eventToEdit?.start || new Date(), "mm")}
                  onChange={(e) => {
                    if (eventToEdit) {
                      const updatedDate = new Date(eventToEdit.start);
                      updatedDate.setMinutes(parseInt(e.target.value));
                      setEventToEdit({ ...eventToEdit, start: updatedDate });
                    }
                  }}
                  required
                  className="w-1/4 border rounded p-2"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  name="startAmPm"
                  value={format(
                    eventToEdit?.start || new Date(),
                    "a"
                  ).toUpperCase()}
                  onChange={(e) => {
                    if (eventToEdit) {
                      let updatedHour = eventToEdit.start.getHours();
                      if (e.target.value === "PM" && updatedHour < 12) {
                        updatedHour += 12;
                      } else if (e.target.value === "AM" && updatedHour >= 12) {
                        updatedHour -= 12;
                      }
                      const updatedDate = new Date(eventToEdit.start);
                      updatedDate.setHours(updatedHour);
                      setEventToEdit({ ...eventToEdit, start: updatedDate });
                    }
                  }}
                  required
                  className="w-1/4 border rounded p-2"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* End Date and Time */}
            <div className="space-y-2">
              <Label>
                End Date & Time <span className="text-red-600">*</span>
              </Label>
              <div className="flex space-x-2">
                <DatePickerWithPresets
                  date={eventToEdit?.end || new Date()}
                  onChange={(date) => {
                    if (date && eventToEdit) {
                      setEventToEdit({ ...eventToEdit, end: date });
                    }
                  }}
                />
                {/* End Time Selects */}
                <select
                  name="endHour"
                  value={format(eventToEdit?.end || new Date(), "h")}
                  onChange={(e) => {
                    if (eventToEdit) {
                      const updatedDate = new Date(eventToEdit.end);
                      updatedDate.setHours(
                        parseInt(e.target.value) +
                          (format(eventToEdit.end, "a").toUpperCase() === "PM"
                            ? 12
                            : 0)
                      );
                      setEventToEdit({ ...eventToEdit, end: updatedDate });
                    }
                  }}
                  required
                  className="w-1/4 border rounded p-2"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                :
                <select
                  name="endMinute"
                  value={format(eventToEdit?.end || new Date(), "mm")}
                  onChange={(e) => {
                    if (eventToEdit) {
                      const updatedDate = new Date(eventToEdit.end);
                      updatedDate.setMinutes(parseInt(e.target.value));
                      setEventToEdit({ ...eventToEdit, end: updatedDate });
                    }
                  }}
                  required
                  className="w-1/4 border rounded p-2"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  name="endAmPm"
                  value={format(
                    eventToEdit?.end || new Date(),
                    "a"
                  ).toUpperCase()}
                  onChange={(e) => {
                    if (eventToEdit) {
                      let updatedHour = eventToEdit.end.getHours();
                      if (e.target.value === "PM" && updatedHour < 12) {
                        updatedHour += 12;
                      } else if (e.target.value === "AM" && updatedHour >= 12) {
                        updatedHour -= 12;
                      }
                      const updatedDate = new Date(eventToEdit.end);
                      updatedDate.setHours(updatedHour);
                      setEventToEdit({ ...eventToEdit, end: updatedDate });
                    }
                  }}
                  required
                  className="w-1/4 border rounded p-2"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action is
              irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
function renderEventContent(eventInfo: EventContentArg) {
  const { event, timeText } = eventInfo;
  const { title, extendedProps } = event;
  const { location, isRecurring } = extendedProps;

  console.log('Rendering event:', {
    title,
    recurrence: extendedProps.recurrence,
    isRecurring
  });
  
  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex items-center gap-1">
        <div className="flex-grow font-medium text-sm truncate dark:text-slate-100">
          {title}
          {isRecurring && (
            <Repeat className="inline-block ml-1 h-3 w-3 text-muted-foreground dark:text-slate-400" />
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground dark:text-slate-300">
        <div>{timeText}</div>
        {location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
