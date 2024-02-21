import {GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
//import { useCustomGoogleLogin} from './GoogleLogin';
import { useAuth } from './AuthContext';


const FetchCalendar = () => {
    //const { isAuthenticated} = useCustomGoogleLogin();
    const { isAuthenticated} = useAuth();

    /*
    useEffect(() => {
        console.log(`Authentication state is now: ${isAuthenticated}`);
    }, [isAuthenticated]);
    */

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
        <GoogleOAuthProvider clientId="1041937426677-4enmc56esrqs872v4j7pphffa76cou3s.apps.googleusercontent.com">
            <div className='App'>
                <h1>Google Calendar API: ListCalendarEvents Function</h1>
                <p>
                    {isAuthenticated ? 'True' : 'False'}
                </p>
                <form onSubmit={viewCalendarEventsSubmit}>
                    <button type="submit" disabled={!isAuthenticated}>View all calendar events</button>
                </form>
            </div>
        </GoogleOAuthProvider>
    );
};

export default FetchCalendar;
