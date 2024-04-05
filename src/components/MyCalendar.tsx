import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from './ui/button';
import { auth } from '../firebase-config';
import { fetchAllEventsFromAllCalendars, createCalendarEvent } from './api';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { onAuthStateChanged } from 'firebase/auth';
import { DatePickerWithPresets } from '@/components/calendar/DatePicker';

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
    startDate: new Date(),
    startHour: '12',
    startMinute: '00',
    startAmPm: 'AM',
    endDate: new Date(),
    endHour: '12',
    endMinute: '00',
    endAmPm: 'PM',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setNewEvent({ ...newEvent, startDate: date || new Date() });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setNewEvent({ ...newEvent, endDate: date || new Date() });
  };

  const handleDropdownChange = (name: string, value: string) => {
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, startDate, startHour, startMinute, startAmPm, endDate, endHour, endMinute, endAmPm } = newEvent;
    if (!title || !startDate || !endDate) {
      alert('All fields are required');
      return;
    }
    const start = new Date(startDate);
    start.setHours(parseInt(startHour) + (startAmPm === 'PM' ? 12 : 0));
    start.setMinutes(parseInt(startMinute));
    const end = new Date(endDate);
    end.setHours(parseInt(endHour) + (endAmPm === 'PM' ? 12 : 0));
    end.setMinutes(parseInt(endMinute));
    const event = {
      title,
      start,
      end,
      allDay: false,
    };
    setEvents([...events, event]);
    setNewEvent({
      title: '',
      startDate: new Date(),
      startHour: '12',
      startMinute: '00',
      startAmPm: 'AM',
      endDate: new Date(),
      endHour: '12',
      endMinute: '00',
      endAmPm: 'PM',
    });

    // Call the createCalendarEvent function from api.ts
    try {
      const user = auth.currentUser;
      if (user) {
        await createCalendarEvent(
          title,
          '',  // Add the description if available
          '',  // Add the location if available
          start.toISOString(),
          end.toISOString(),
          'primary',  // Use the appropriate calendar ID
          user.uid
        );
        console.log('Event created successfully');
      } else {
        console.log('No authenticated user found.');
      }
    } catch (error) {
      console.error('Error in creating calendar event:', error);
    }
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
    <div className="bg-white rounded-lg shadow-md p-6 w-[100%]">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <p className="text-gray-600 mb-6">Add information to add only to react calendar</p>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <input
            type="text"
            name="title"
            placeholder="Event Title"
            value={newEvent.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4 flex items-center">
          <div className="mr-4">
            <label htmlFor="startDate" className="block mb-1">
              Start Date
            </label>
            <div className="flex items-center">
              <DatePickerWithPresets date={newEvent.startDate} onChange={handleStartDateChange} />
              <div className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-20 justify-start">
                      {newEvent.startHour}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Start Hour</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Array.from({ length: 12 }, (_, i) => (
                      <DropdownMenuCheckboxItem
                        key={i + 1}
                        checked={newEvent.startHour === (i + 1).toString()}
                        onCheckedChange={() => handleDropdownChange('startHour', (i + 1).toString())}
                      >
                        {i + 1}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-20 justify-start">
                      {newEvent.startMinute}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Start Minute</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {['00', '15', '30', '45'].map((minute) => (
                      <DropdownMenuCheckboxItem
                        key={minute}
                        checked={newEvent.startMinute === minute}
                        onCheckedChange={() => handleDropdownChange('startMinute', minute)}
                      >
                        {minute}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-20 justify-start">
                      {newEvent.startAmPm}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>AM/PM</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={newEvent.startAmPm === 'AM'}
                      onCheckedChange={() => handleDropdownChange('startAmPm', 'AM')}
                    >
                      AM
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={newEvent.startAmPm === 'PM'}
                      onCheckedChange={() => handleDropdownChange('startAmPm', 'PM')}
                    >
                      PM
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center">
          <div className="mr-4">
            <label htmlFor="endDate" className="block mb-1">
              End Date
            </label>
            <div className="flex items-center">
              <DatePickerWithPresets date={newEvent.endDate} onChange={handleEndDateChange} />
              <div className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-20 justify-start">
                      {newEvent.endHour}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>End Hour</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Array.from({ length: 12 }, (_, i) => (
                      <DropdownMenuCheckboxItem
                        key={i + 1}
                        checked={newEvent.endHour === (i + 1).toString()}
                        onCheckedChange={() => handleDropdownChange('endHour', (i + 1).toString())}
                      >
                        {i + 1}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-20 justify-start">
                      {newEvent.endMinute}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>End Minute</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {['00', '15', '30', '45'].map((minute) => (
                      <DropdownMenuCheckboxItem
                        key={minute}
                        checked={newEvent.endMinute === minute}
                        onCheckedChange={() => handleDropdownChange('endMinute', minute)}
                      >
                        {minute}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-20 justify-start">
                      {newEvent.endAmPm}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>AM/PM</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={newEvent.endAmPm === 'AM'}
                      onCheckedChange={() => handleDropdownChange('endAmPm', 'AM')}
                    >
                      AM
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={newEvent.endAmPm === 'PM'}
                      onCheckedChange={() => handleDropdownChange('endAmPm', 'PM')}
                    >
                      PM
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        <Button type="submit" className="bg-blue-500 text-white">
          Add Event
        </Button>
      </form>
      <div className="rounded-lg overflow-hidden">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          className="bg-white"
        />
      </div>
    </div>
  );
};

export default MyCalendar;