"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';

import { useEffect, useState } from 'react';
import { Button } from "../components/ui/button";
import { findOrCreateSyallbusSyncCalendar } from './FindOrCreateSyallbusSyncCalendar';
import {auth} from "../firebase-config";

const CreateCalendarEvent = () => {

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

            const firebaseUser = auth.currentUser;
            if (!firebaseUser) {
                console.error('No Firebase user logged in');
                return;
            }

            axios.post('http://localhost:3001/api/create-event', { summary, description, location, startDateTime, endDateTime, calendarId, uid: firebaseUser.uid })
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
        <GoogleOAuthProvider clientId="879578989203-0mpip3uokcaupv52p6692rd79l42tjuu.apps.googleusercontent.com">
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
                    <Button type="submit">Create an Event</Button>
                </form>
            </div>
        </GoogleOAuthProvider>
    );
};

export default CreateCalendarEvent;