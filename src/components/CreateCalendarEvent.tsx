"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useEffect, useState } from 'react';
import { Button } from "../components/ui/button";
import { findOrCreateSyallbusSyncCalendar } from './FindOrCreateSyallbusSyncCalendar';

const CreateCalendarEvent = () => {
    const { isAuthenticated} = useAuth();

    const [summary, setSummary] = useState('')
    const [description, setDescription] = useState('')
    const [location,setLocation] = useState('')
    const [startDateTime, setStartDateTime] = useState('')
    const [endDateTime, setEndDateTime] = useState('')
    const [calendarId, setCalendarId] = useState('')
    const [triggerEventCreation, setTriggerEventCreation] = useState(false);

    useEffect(() => {
        if (calendarId && triggerEventCreation) {
            // Now that calendarId is updated, you can proceed with creating the event
            axios.post('http://localhost:3001/api/create-event', { summary, description, location, startDateTime, endDateTime, calendarId })
                .then(response => {
                    console.log(response.data);
                    setTriggerEventCreation(false);
                })
                .catch(error => {
                    console.log(error.message)
                    setTriggerEventCreation(false);
                });
        }
    }, [calendarId, triggerEventCreation]); // This effect runs whenever `calendarId` changes.

    const viewCreateCalendarEventSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(summary, description,location, startDateTime, endDateTime);
        if (!isAuthenticated) {
            console.log('No access token available.');
            return;
        }
        //TODO change url to actual server url
        //const response = await axios.post('http://localhost:3001/api/create-event', { code });

        findOrCreateSyallbusSyncCalendar()
                .then((retrievedCalendarId) => {
                    setCalendarId(retrievedCalendarId);
                    setTriggerEventCreation(true);
                })
                .catch(error => console.error('Error in finding/creating calendar:', error));
        
        

    };
    return (
        <GoogleOAuthProvider clientId="your-client-id">
            <div className='App'>
                <h1>Google Calendar API: Create Calendar Event Function</h1>

                <form onSubmit={viewCreateCalendarEventSubmit}>

                    <label htmlFor="summary">Summary</label>
                    <br />
                    <input type="text" id="summary" value = {summary} onChange={e => setSummary(e.target.value)}  />
                    <br />

                    <label htmlFor="description">Description</label>
                    <br />
                    <input type = "text" id="description" value={description} onChange={e=> setDescription(e.target.value)} />
                    <br />

                    <label htmlFor="location">Location</label>
                    <br />
                    <input type = "text" id="location" value={location} onChange={e=> setLocation(e.target.value)} />
                    <br />

                    <label htmlFor="startDateTime">Start Date Time</label>
                    <br />
                    <input type = "datetime-local" id="startDateTime" value={startDateTime} onChange={e=> setStartDateTime(e.target.value)} />
                    <br />

                    <label htmlFor="endDateTime">End Date Time</label>
                    <br />
                    <input type = "datetime-local" id="endDateTime" value={endDateTime} onChange={e=> setEndDateTime(e.target.value)} />
                    <br />
                    <Button type="submit" disabled={!isAuthenticated}>Create an Event</Button>
                </form>
            </div>
        </GoogleOAuthProvider>
    );
};

export default CreateCalendarEvent;