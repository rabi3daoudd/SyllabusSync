import '../src/app/globals.css'
// import Test from "./components/OpenAITest"
import MyComponent from './components/MyComponent'
import FetchCalendarEvents from "./components/FetchCalendarEvents";
import { AuthProvider } from './components/AuthContext';
import SignInButton from './components/SignInButton';
import FetchUserCalendars from './components/FetchUserCalendars'
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/ui/Navbar';
function App() {
  //const { SignInWithGoogleButton, isAuthenticated } = useCustomGoogleLogin();

  return (
    <>
    <Navbar/>
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
    </>

  )
}

export default App
