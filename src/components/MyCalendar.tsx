import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from './ui/button';
import { auth } from '../firebase-config';
import { fetchAllEventsFromAllCalendars } from './api';
import { onAuthStateChanged } from 'firebase/auth';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

const MyCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { title, start, end } = newEvent;

    if (!title || !start || !end) {
      alert('All fields are required');
      return;
    }

    const event = {
      title,
      start: new Date(start),
      end: new Date(end),
      allDay: false, 
    };

    setEvents([...events, event]);
    setNewEvent({ title: '', start: '', end: '' }); // Reset the form
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Authenticated user found, fetching events...');
        const fetchedEvents = await fetchAllEventsFromAllCalendars(user.uid);
        setEvents(fetchedEvents);
      } else {
        console.log('No authenticated user found.');
      }
    });
    return () => unsubscribe();
  }, []);


  return (
    <div>
      <h1 className="text-xl font-bold p-4 text-left">Calendar</h1>
      <p className="text-l p-4 text-left">Add information to add only to react calendar</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Event Title"
          value={newEvent.title}
          onChange={handleInputChange}
        />
        <input
          type="datetime-local"
          name="start"
          value={newEvent.start}
          onChange={handleInputChange}
        />
        <input
          type="datetime-local"
          name="end"
          value={newEvent.end}
          onChange={handleInputChange}
        />
        <Button type="submit">Add Event</Button>
      </form>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default MyCalendar;