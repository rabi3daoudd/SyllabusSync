import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

const clientId = '879578989203-0mpip3uokcaupv52p6692rd79l42tjuu.apps.googleusercontent.com';

interface CustomGoogleLoginResponse extends GoogleLoginResponse {
    profileObj: {
        googleId: string;
        name: string;
        email: string;
        imageUrl: string;
        givenName: string;  // Added missing property
        familyName: string; // Added missing property
    };
}

function Login() {
    const onSuccess = (res: CustomGoogleLoginResponse | GoogleLoginResponseOffline) => {
        if ('profileObj' in res) {
            console.log('Login Success: currentUser:', res.profileObj);
        }
    };

    const onFailure = (res: any) => {
        console.log('Login failed: res:', res);
    };

    return (
        <div>
            <GoogleLogin
                clientId={clientId}
                buttonText="Login"
                onSuccess={onSuccess}
                onFailure={onFailure}
                cookiePolicy={'single_host_origin'}
                scope="https://www.googleapis.com/auth/calendar.events"
            />
        </div>
    );
}

export default Login;
