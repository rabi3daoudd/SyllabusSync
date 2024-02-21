import './App.css'
// import Test from "./components/OpenAITest"
import MyComponent from './components/MyComponent'
import FetchCalendar from "./components/FetchCalendar";
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
      <FetchCalendar />
      <FetchUserCalendars />
    </AuthProvider>
)
}

export default App
