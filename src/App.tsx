import './App.css'
// import Test from "./components/OpenAITest"
import MyComponent from './components/MyComponent'
import FetchCalendar from "./components/FetchCalendar";
import {useCustomGoogleLogin} from "./components/GoogleLogin";

function App() {
  const {SignInWithGoogleButton } = useCustomGoogleLogin();

  return (
    <>
      <MyComponent />
        <SignInWithGoogleButton />
        <FetchCalendar />
      {/* <Test /> */}
    </>

  )
}

export default App
