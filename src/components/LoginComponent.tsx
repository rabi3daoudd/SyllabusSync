import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { useState } from "react";

const LoginComponent = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const googleLogin = useGoogleLogin({
        onSuccess: (codeResponse) => {
            const { code } = codeResponse;
            axios.post('http://localhost:3001/api/create-tokens', { code })
                .then((response) => {
                    console.log(response)
                    setIsAuthenticated(true); // Assuming authentication is successful
                })
                .catch(error => {
                    console.error('Token exchange failed:', error.response?.data || error.message);
                });
        },
        onError: () => {
            console.log('Login Failed');
        },
        flow: 'auth-code',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isAuthenticated) {
            console.log('No access token available.');
            return;
        }

        // Removed the Authorization header
        axios.get('http://localhost:3001/api/list-events')
            .then(response => {
                console.log('Calendars fetched:', response.data); // Just print out the response data
            })
            .catch(error => {
                console.error('Failed to fetch calendars:', error.response?.data || error.message);
            });
    };

    return (
        <GoogleOAuthProvider clientId="your-client-id">
            <div className='App'>
                <h1>Google Calendar API</h1>
                <button onClick={() => googleLogin()}>Sign in with Google</button>
                <form onSubmit={handleSubmit}>
                    <button type="submit" disabled={!isAuthenticated}>View all calendars</button>
                </form>
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginComponent;
