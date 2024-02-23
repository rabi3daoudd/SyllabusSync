"use client";

import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { useState } from "react";

const FetchCalendar = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const googleLogin = useGoogleLogin({
        onSuccess: (codeResponse) => {
            const { code } = codeResponse;
            //TODO change url to actual server url
            axios.post('http://localhost:3001/api/create-tokens', { code })
                .then(() => {
                    setIsAuthenticated(true);
                })
                .catch(error => {
                    console.error('Token exchange failed:', error.response?.data || error.message);
                });
        },
        onError: () => {
            console.log('Login Failed');
        },
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/calendar'
    });

    const viewCalendarEventsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isAuthenticated) {
            console.log('No access token available.');
            return;
        }
        //TODO change url to actual server url
        axios.get('http://localhost:3001/api/list-events')
            .then(response => {
                console.log('Calendar events fetched:', response.data);
            })
            .catch(error => {
                console.error('Failed to fetch calendar events:', error.response?.data || error.message);
            });
    };

    return (
        <GoogleOAuthProvider clientId="your-client-id">
            <div className='App'>
                <h1>Google Calendar API</h1>
                <button onClick={() => googleLogin()}>Sign in with Google</button>
                <form onSubmit={viewCalendarEventsSubmit}>
                    <button type="submit" disabled={!isAuthenticated}>View all calendar events</button>
                </form>
            </div>
        </GoogleOAuthProvider>
    );
};

export default FetchCalendar;