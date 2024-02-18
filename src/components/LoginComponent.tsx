import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';

const LoginComponent = () => {
    const responseGoogle = (response: CredentialResponse) => {
        console.log(response);
    };

    const responseError = () => {
        console.log('Login Failed');
    };

    return (
        <GoogleOAuthProvider clientId="879578989203-0mpip3uokcaupv52p6692rd79l42tjuu.apps.googleusercontent.com">
            <div>
                <div className='App'>
                    <h1>Google Calendar API</h1>
                </div>
                <div>
                    <GoogleLogin
                        onSuccess={responseGoogle}
                        onError={responseError}
                    />
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}

export default LoginComponent;
