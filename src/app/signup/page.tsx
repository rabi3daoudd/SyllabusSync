"use client"; 

import Link from 'next/link';
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Use useRouter from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase-config'; // Update the path as needed
import { doc, setDoc } from "firebase/firestore";
import { CardTitle, CardDescription, CardHeader, CardFooter, Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import "../globals.css";

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const router = useRouter(); // Use useRouter hook

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Save additional information in Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email
      });
      console.log("Account created and user information saved");

      // Use setTimeout to ensure it's called after rendering
      setTimeout(() => router.push('/'), 0);
      
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto mt-10">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold">Sign Up</CardTitle>
        <CardDescription>Create your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignUp} className="space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required type="password" />
        </div>
        <Button type="submit" className="w-full">Sign Up</Button>
      </form>
      <CardFooter className="p-6">
        <p className="text-center">
          Already have an account?{' '}
          <Link href="/login">
            <span className="text-blue-500 hover:text-blue-700 cursor-pointer">Login</span>
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignUpPage;
