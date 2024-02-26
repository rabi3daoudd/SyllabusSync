import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config'; // Update the path as needed
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardContent } from "../components/ui/card"; // Assuming similar styled components as before
import { Button } from "../components/ui/button";


const App = dynamic(() => import('../App'), { ssr: false });

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email);
        const name = user.displayName || 'there'; // Use displayName for users who signed in with Google
        setUserName(name);

        if (!user.displayName) { // Fetch additional details from Firestore for email/password sign-ups
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(`${userData.firstName} ${userData.lastName}`);
          }
        }
      } else {
        setUserEmail(null);
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold">Welcome to the Home Page</h1>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {userEmail ? (
            <>
              <p>Logged in as: <strong>{userEmail}</strong></p>
              <p>Hello, <strong>{userName}</strong></p>
              <Button onClick={handleSignOut} className="w-full">Sign Out</Button>
            </>
          ) : (
            <>
              <p>Please log in to view content</p>
              <Button onClick={handleSignIn} className="w-full">Login</Button>
            </>
          )}
        </CardContent>
      </Card>
      <App /> {/* Keep the App component at the bottom */}
    </div>
  );
}
