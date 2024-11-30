'use client';

import React, { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import scrollGridPlugin from '@fullcalendar/scrollgrid';
import { EventClickArg } from '@fullcalendar/core';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase-config';
import { fetchAllEventsFromAllCalendars } from '@/components/api';
import { onAuthStateChanged } from 'firebase/auth';
import { CalendarIcon, MapPin } from 'lucide-react';
import '@/styles/calendar.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  description?: string;
  location?: string;
  googleEventId?: string;
  calendarId?: string;
}

const MyCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const router = useRouter();

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = {
        id: clickInfo.event.id,
        title: clickInfo.event.title,
        description: clickInfo.event.extendedProps.description || '',
        location: clickInfo.event.extendedProps.location || '',
        start: clickInfo.event.start || new Date(),
        end: clickInfo.event.end || new Date(),
        googleEventId: clickInfo.event.id, // Make sure this is set
        calendarId: clickInfo.event.extendedProps.calendarId || 'primary', // Make sure this is set
    };
    setSelectedEvent(event);
    setIsViewModalOpen(true);
}, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Authenticated user found, fetching events...");
        const fetchedEvents = await fetchAllEventsFromAllCalendars(user.uid);
        console.log("Fetched Events:", fetchedEvents);
        fetchedEvents.forEach((event) => {
          console.log(`Event ID: ${event.id}, Title: ${event.title}, Start: ${event.start}, End: ${event.end}`);
        });
        setEvents(fetchedEvents);
      } else {
        console.log("No authenticated user found.");
      }
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full h-screen flex flex-col p-4">
      <div className="flex justify-between items-center p-4 bg-background border-b">
        <h1 className="text-2xl font-bold">Today's Schedule</h1>
        <Button onClick={() => router.push('/calendar')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          View Full Calendar
        </Button>
      </div>
      <div className="flex-grow w-full h-[calc(100vh-80px)]">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin, scrollGridPlugin]}
          initialView="timeGridDay"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          eventClick={handleEventClick}
          height="100%"
          eventDisplay="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          eventBackgroundColor="hsl(var(--primary))"
          eventBorderColor="hsl(var(--primary))"
          eventTextColor="hsl(var(--primary-foreground))"
          eventClassNames="calendar-event"
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          nowIndicator={true}
          scrollTime={(new Date()).getHours() + ":00:00"}
        />
      </div>
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEvent?.description && (
              <div>
                <Label>Description</Label>
                <p>{selectedEvent.description}</p>
              </div>
            )}
            {selectedEvent?.location && (
              <div>
                <Label>Location</Label>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedEvent.location}
                </p>
              </div>
            )}
            <div>
              <Label>Start</Label>
              <p>{selectedEvent?.start.toLocaleString()}</p>
            </div>
            <div>
              <Label>End</Label>
              <p>{selectedEvent?.end.toLocaleString()}</p>
            </div>
          </div>
          <DialogFooter className="flex justify-between items-center mt-4">
            {selectedEvent?.googleEventId && (
              <Button
                variant="outline"
                onClick={() => {
                  const eid = btoa(`${selectedEvent.googleEventId} ${selectedEvent.calendarId}`);
                  const url = `https://calendar.google.com/calendar/event?eid=${eid}`;
                  window.open(url, '_blank');
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                View in Google Calendar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCalendar;