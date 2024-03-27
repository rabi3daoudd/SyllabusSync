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

function App() {
    //const { SignInWithGoogleButton, isAuthenticated } = useCustomGoogleLogin();

    return (
        <GoogleOAuthProvider clientId="Add client ID here">
            <AuthProvider>
                {/* <SignIn /> */}
                <MyComponent />
                <Navbar />
                {/* <SignInWithGoogleButton /> */}
                <SignInButton />
                <FetchCalendarEvents />
                <FetchUserCalendars />
                <CreateCalendarEvent />
            </AuthProvider>
        </GoogleOAuthProvider>

    )
}

export default App
