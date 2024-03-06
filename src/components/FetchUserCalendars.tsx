"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Button } from "../components/ui/button";

const FetchUserCalendars = () => {

    const { isAuthenticated} = useAuth();

    const viewUserCalendarsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isAuthenticated) {
            console.log('No access token available.');
            return;
        }
        //TODO change url to actual server url
        axios.get('http://localhost:3001/api/list-user-calendars')
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
                    <Button type="submit" disabled={!isAuthenticated}>View all user calendars</Button>
                </form>
            </div>
        </GoogleOAuthProvider>
    );
};

export default FetchUserCalendars;

