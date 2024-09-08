"use client";

import {GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
//import { useCustomGoogleLogin} from './GoogleLogin';
import { useAuth } from './AuthContext';
import { Button } from "../components/ui/button";
import { auth } from '../firebase-config';


const FetchCalendarEvents = () => {
    //const { isAuthenticated} = useCustomGoogleLogin();
    const { isAuthenticated} = useAuth();

    const viewCalendarEventsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const firebaseUser = auth.currentUser;
        const calendarId = 'primary';
        if (!firebaseUser) {
            console.error('No Firebase user logged in');
            return;
        }

        const queryParams = new URLSearchParams({ uid: firebaseUser.uid, calendarId: calendarId, });

        //TODO change url to actual server url
        axios.get(`/api/list-events?${queryParams}`)
            .then(response => {
                console.log('Calendar events fetched:', response.data);
            })
            .catch(error => {
                console.error('Failed to fetch calendar events:', error.response?.data || error.message);
            });
    };

    return (
        <GoogleOAuthProvider clientId="ADD CLIENT ID">
            <div className='App'>
                <h1>Google Calendar API: ListCalendarEvents Function</h1>
                <p>
                    {isAuthenticated ? 'True' : 'False'}
                </p>
                <form onSubmit={viewCalendarEventsSubmit}>
                    <Button type="submit">View all calendar events</Button>
                </form>
            </div>
        </GoogleOAuthProvider>
    );
};

export default FetchCalendarEvents;
