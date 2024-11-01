// SignIn.tsx

"use client";

import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import "../globals.css";

interface SignInProps {
  onSubmit: () => void;
  onGoogleSignIn: () => void;
}

export function SignIn({ onSubmit, onGoogleSignIn }: SignInProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-6">
        <CardTitle className="text-xl">Sign in to your account</CardTitle>
        <CardDescription>
          Enter your information below to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="Username" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="Password"
            required
            type="password"
          />
        </div>
        <Button className="w-full" onClick={onSubmit}>
          Sign In
        </Button>
      </CardContent>
      <CardFooter className="p-6 justify-center">
        <Button className="w-full" variant="outline" onClick={onGoogleSignIn}>
          Sign in with Google
        </Button>
      </CardFooter>
    </Card>
  );
}
