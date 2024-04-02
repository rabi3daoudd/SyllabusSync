import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment); 

const myEventsList = [
  {
    title: 'Study Session',
    start: new Date(2024, 3, 14, 10, 0), 
    end: new Date(2024, 3, 14, 12, 0), 
    allDay: false,
  },
  // ...more events
];

const MyCalendar: React.FC = () => {
  return (
    <div>
      <h1 className="text-xl font-bold p-4 text-left">Calendar</h1>
      <Calendar
        localizer={localizer}
        events={myEventsList}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default MyCalendar;
