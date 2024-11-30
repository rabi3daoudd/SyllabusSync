"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventDragStopArg,
  EventResizeDoneArg,
} from "@fullcalendar/interaction";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import rrulePlugin from "@fullcalendar/rrule";
import { RRule } from "rrule";
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
import {
  fetchAllEventsFromAllCalendars,
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/components/api";
import { onAuthStateChanged } from "firebase/auth";
import {
  Calendar as CalendarIcon,
  MapPin,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCcw,
  PlusCircle,
  X,
  Repeat,
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
    setNewEvent({
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
    });
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
      } = newEvent;

      // Add debug logging
      console.log("Creating event with title:", title);

      // Validate required fields
      if (!title || !startDate || !endDate) {
        toast({
          title: "Validation Error",
          description: "Title, start date, and end date are required",
          variant: "destructive",
        });
        return;
      }

      // Construct start and end Date objects
      const start = new Date(startDate);
      start.setHours(parseInt(startHour) + (startAmPm === "PM" ? 12 : 0));
      start.setMinutes(parseInt(startMinute));

      const end = new Date(endDate);
      end.setHours(parseInt(endHour) + (endAmPm === "PM" ? 12 : 0));
      end.setMinutes(parseInt(endMinute));

      try {
        const user = auth.currentUser;
        if (user) {
          const createdEvent = await createCalendarEvent(
            title.trim(), // Ensure title is trimmed
            description,
            "",
            start.toISOString(),
            end.toISOString(),
            "primary",
            user.uid
          );

          console.log("Created event response:", createdEvent);

          if (!createdEvent.id) {
            throw new Error("Event ID is missing from the creation response.");
          }

          const newCalendarEvent: CalendarEvent = {
            id: createdEvent.id,
            title: title.trim(), // Ensure title is set and trimmed
            description,
            location: "",
            start,
            end,
            allDay: false,
            googleEventId: createdEvent.id,
            calendarId: "primary",
          };

          console.log("New calendar event object:", newCalendarEvent);

          setEvents((prevEvents) => [...prevEvents, newCalendarEvent]);
          cleanupAfterEventCreation();
          toast({
            title: "Event Created",
            description: "Your event has been successfully created.",
          });
        }
      } catch (error) {
        console.error("Error in creating calendar event:", error);
        toast({
          title: "Error",
          description: "Failed to create event. Please try again.",
          variant: "destructive",
        });
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
      googleEventId: clickInfo.event.id,
      calendarId: clickInfo.event.extendedProps.calendarId || "primary",
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Authenticated user found, fetching events...");
        const fetchedEvents = await fetchAllEventsFromAllCalendars(user.uid);
        setEvents(fetchedEvents);
      } else {
        console.log("No authenticated user found.");
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
          events={events.map((event) => ({
            ...event,
            rrule:
              event.recurrence && event.recurrence.length > 0
                ? {
                    ...RRule.parseString(event.recurrence[0]),
                    dtstart: event.start,
                  }
                : undefined,
            location: event.location,
          }))}
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
                    console.log(
                      "DatePickerWithPresets Start Date Change:",
                      date
                    );
                    date && handleStartDateChange(date);
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
                    console.log("DatePickerWithPresets End Date Change:", date);
                    date && handleEndDateChange(date);
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

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Add Event
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Event Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 [&>button]:hidden">
          <div className="w-full rounded-lg bg-background p-4">
            {/* Tools row at the top with absolute positioning */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={openEditModal}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDeleteEvent}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsViewModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content with top margin to clear the buttons */}
            <div className="mt-8 flex items-start gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{selectedEvent?.title}</h3>
                  {selectedEvent?.googleEventId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        const eid = btoa(
                          `${selectedEvent.googleEventId} ${selectedEvent.calendarId}`
                        );
                        const url = `https://calendar.google.com/calendar/event?eid=${eid}`;
                        window.open(url, "_blank");
                      }}
                      aria-label="View in Google Calendar"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent?.start.toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  ·{" "}
                  {selectedEvent?.start.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  –{" "}
                  {selectedEvent?.end.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {selectedEvent?.description && (
                <div className="flex items-start gap-2">
                  <CalendarIcon className="mt-1 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent?.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{selectedEvent.location}</p>
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

function renderEventContent(eventInfo: {
  event: {
    title: string;
    extendedProps: { location?: string; rrule?: string };
  };
  timeText: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-2 text-primary-foreground">
      <div className="text-sm font-medium truncate">
        {eventInfo.event.title}
      </div>
      <div className="text-xs opacity-90 flex flex-col">
        <span>{eventInfo.timeText}</span>
        {eventInfo.event.extendedProps.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {eventInfo.event.extendedProps.location}
          </span>
        )}
        {eventInfo.event.extendedProps.rrule && (
          <span className="flex items-center gap-1">
            <Repeat className="h-3 w-3" />
            Recurring Event
          </span>
        )}
      </div>
    </div>
  );
}
