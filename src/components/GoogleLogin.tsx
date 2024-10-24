"use client";

import { useEffect} from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Button } from "../components/ui/button";
import { auth } from '../firebase-config';

export const useCustomGoogleLogin = () => {
    //const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { isAuthenticated, setIsAuthenticated } = useAuth();

    const googleLogin = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            const { code } = codeResponse;

            const firebaseUser = auth.currentUser;
            if (!firebaseUser) {
                console.error('No Firebase user logged in');
                return;
            }
            try {
                const response = await axios.post('/api/create-tokens', {
                    code,
                    uid: firebaseUser.uid
                });

                console.log('Token exchange success:', response.data);
                setIsAuthenticated(true);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    // Now TypeScript knows error is an AxiosError
                    console.error('Token exchange failed:', error.response?.data);
                } else if (error instanceof Error) {
                    // This checks if it's an Error object and safely accesses the message property
                    console.error('Token exchange failed:', error.message);
                } else {
                    // Fallback for handling non-Error, unknown types
                    console.error('Token exchange failed:', error);
                }
            }
        },
        onError: () => {
            console.log('Login Failed');
        },
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/calendar',
    });

    useEffect(() => {
        console.log(`AFTER GOOGLE LOGIN: Authentication state is now: ${isAuthenticated}`);
    }, [isAuthenticated]);

    const SignInWithGoogleButton = () => (
        <Button onClick={() => googleLogin()}>Connect your calender with a Google account</Button>
    );

    return { isAuthenticated, SignInWithGoogleButton };
};