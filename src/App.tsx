import '../src/app/globals.css'
// import Test from "./components/OpenAITest"
import MyComponent from './components/MyComponent'
import FetchCalendarEvents from "./components/FetchCalendarEvents";
import { AuthProvider } from './components/AuthContext';
import SignInButton from './components/SignInButton';
import FetchUserCalendars from './components/FetchUserCalendars'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SignIn } from './components/SignIn';

function App() {
  //const { SignInWithGoogleButton, isAuthenticated } = useCustomGoogleLogin();

  return (
    <GoogleOAuthProvider clientId="PLACE CLIENT ID HERE">
      <AuthProvider>
        {/* <SignIn /> */}
        <MyComponent />
        {/* <SignInWithGoogleButton /> */}
        <SignInButton />
        <FetchCalendarEvents />
        <FetchUserCalendars />
      </AuthProvider>
    </GoogleOAuthProvider>

  )
}

export default App
