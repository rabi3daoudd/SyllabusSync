import { useState } from 'react';
import { useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';

export const useCustomGoogleLogin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const googleLogin = useGoogleLogin({
        onSuccess: (codeResponse) => {
            const { code } = codeResponse;
            axios.post('http://localhost:3001/api/create-tokens', { code })
                .then((response) => {
                    console.log("RESPONSE LOL:"+response);
                    setIsAuthenticated(true);
                })
                .catch(error => {
                    console.error('Token exchange failed:', error.response?.data || error.message);
                });
        },
        onError: () => {
            console.log('Login Failed');
        },
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/calendar'
    });

    const SignInWithGoogleButton = () => (
        <button onClick={() => googleLogin()}>Sign in with Google</button>
    );

    return { isAuthenticated, SignInWithGoogleButton };
};