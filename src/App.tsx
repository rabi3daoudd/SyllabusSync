import '../src/app/globals.css'
// import Test from "./components/OpenAITest"
import Navbar from './components/navigation/Navbar';
import MyComponent from './components/MyComponent'
import FetchCalendarEvents from "./components/FetchCalendarEvents";
import { AuthProvider } from './components/AuthContext';
import SignInButton from './components/SignInButton';
import FetchUserCalendars from './components/FetchUserCalendars'
import { GoogleOAuthProvider } from '@react-oauth/google';
import CreateCalendarEvent from './components/CreateCalendarEvent';
import FetchAllEventsFromAllCalendars from "./components/FetchAllEventsFromAllCalendars";

function App() {
    //const { SignInWithGoogleButton, isAuthenticated } = useCustomGoogleLogin();
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <AuthProvider>
                {/* <SignIn /> */}
                <MyComponent />
                <Navbar />
                {/* <SignInWithGoogleButton /> */}
                <SignInButton />
                <FetchCalendarEvents />
                <FetchAllEventsFromAllCalendars />
                <FetchUserCalendars />
                <CreateCalendarEvent />
            </AuthProvider>
        </GoogleOAuthProvider>

    )
}

export default App
