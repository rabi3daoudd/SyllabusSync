import './App.css'
// import Test from "./components/OpenAITest"
import MyComponent from './components/MyComponent'
import FetchCalendarEvents from "./components/FetchCalendarEvents";
import { AuthProvider } from './components/AuthContext';
import SignInButton from './components/SignInButton';
import FetchUserCalendars from './components/FetchUserCalendars'

function App() {
  //const { SignInWithGoogleButton, isAuthenticated } = useCustomGoogleLogin();

  return (
    <AuthProvider>
      <MyComponent />
      {/* <SignInWithGoogleButton /> */}
      <SignInButton />
      <FetchCalendarEvents />
      <FetchUserCalendars />
    </AuthProvider>
)
}

export default App
