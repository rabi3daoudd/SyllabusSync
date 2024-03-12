"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { Button } from "../components/ui/button";
import { auth } from '../firebase-config';

const FetchUserCalendars = () => {

    const viewUserCalendarsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            console.error('No Firebase user logged in');
            return;
        }

        const queryParams = new URLSearchParams({ uid: firebaseUser.uid });

        //TODO change url to actual server url
        axios.get(`http://localhost:3001/api/list-user-calendars?${queryParams}`)
            .then(response => {
                console.log('User Calendar events fetched:', response.data);
            })
            .catch(error => {
                console.error('Failed to fetch user calendars:', error.response?.data || error.message);
            });
    };

    return (
        <GoogleOAuthProvider clientId="your-client-id">
            <div className='App'>
                <h1>Google Calendar API: ListUserCalendars Function</h1>

                <form onSubmit={viewUserCalendarsSubmit}>
                    <Button type="submit">View all user calendars</Button>
                </form>
            </div>
        </GoogleOAuthProvider>
    );
};

export default FetchUserCalendars;

