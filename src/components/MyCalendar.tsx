import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from './ui/button';

const localizer = momentLocalizer(moment);

const MyCalendar: React.FC = () => {
  const [events, setEvents] = useState([
    {
      title: 'Midterm',
      start: new Date(2024, 3, 14, 10, 0), 
      end: new Date(2024, 3, 14, 12, 0), 
      allDay: false,
    },
    // ...more events
  ]);

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
      allDay: false, // or dynamically set based on user input
    };

    setEvents([...events, event]);

    setNewEvent({ title: '', start: '', end: '' }); // Reset the form
  };

  return (
    <div>
      <h1 className="text-xl font-bold p-4 text-left">Calendar</h1>
      {/* <Button onClick={() => console.log('Add session form opened')}>
        Add Session
      </Button> */}
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
