import Link from 'next/link';
import React, { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase-config'; // Update the path as needed
import { useRouter } from 'next/router';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CardTitle, CardDescription, CardHeader, CardFooter, Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import '../app/globals.css';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const router = useRouter();

    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in successfully!");
            router.push('/');
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
            }
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if the user's data already exists in Firestore
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            // If the user's data doesn't exist, add it to Firestore
            if (!docSnap.exists()) {
                await setDoc(userRef, {
                    firstName: user.displayName?.split(' ')[0] || '', // Attempt to split the displayName to get the first name
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '', // Get the last name, if any
                    email: user.email,
                });
                console.log("User data added to Firestore");
            }

            console.log("Signed in with Google:", user);
            router.push('/'); // Redirect to the home page
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card className="w-full max-w-sm mx-auto mt-10">
            <CardHeader className="p-6">
                <CardTitle className="text-xl font-bold">Login</CardTitle>
                <CardDescription>Enter your email and password below to log in to your account, or sign in with Google.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin} className="space-y-4 p-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required type="password" />
                </div>
                <Button type="submit" className="w-full">Login</Button>
            </form>
            <CardFooter className="p-6 flex flex-col space-y-4">
                <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
                    Sign in with Google
                </Button>
                <p className="text-center">
                    Don't have an account?{' '}
                    <Link href="/signup">
                        <span className="text-blue-500 hover:text-blue-700 cursor-pointer">Sign Up</span>
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
};

export default LoginPage;
