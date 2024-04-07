import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase-config";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { TabsTrigger, TabsList, TabsContent, Tabs } from "@/components/ui/tabs";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";

import { AuthProvider } from "@/components/AuthContext";
import SignInButton from "@/components/SignInButton";

export default function Settings() {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [studyTimes, setStudyTimes] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isGoogleCalendarSynced, setIsGoogleCalendarSynced] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setEmail(userData.email || "");
          setStudyTimes(userData.preferences?.StudyTimes || "");
          setSessionDuration(userData.preferences?.StudySessionDuration || "");

          if (userData.refresh_token) {
            setIsGoogleCalendarSynced(true);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveInfo = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Validate the required fields
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
          toast({
            title: "Validation Error",
            description:
              "Please fill in all the required fields (First Name, Last Name, Email).",
            variant: "destructive",
          });
          return;
        }

        setIsSaving(true); // Set isSaving to true when the save process starts

        const userDocRef = doc(db, "users", user.uid);

        const updatedData: {
          firstName: string;
          lastName: string;
          email: string;
          profilePictureURL?: string;
        } = {
          firstName,
          lastName,
          email,
        };

        await updateDoc(userDocRef, updatedData);

        // Fetch the updated user data from Firestore
        const updatedUserDocSnapshot = await getDoc(userDocRef);
        if (updatedUserDocSnapshot.exists()) {
          const updatedUserData = updatedUserDocSnapshot.data();
          setFirstName(updatedUserData.firstName || "");
          setLastName(updatedUserData.lastName || "");
          setEmail(updatedUserData.email || "");
        }

        toast({
          title: "User data updated",
          description: "Your user data has been successfully updated",
        });

        setIsEditing(false);
        setIsEditing(false);
        setIsEditingPreferences(false);
        setHasChanges(false); // Set hasChanges to false after a successful save
      }
    } catch (error) {
      toast({
        title: "Error updating user data",
        description:
          "An error occurred while updating your user data, try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false); // Set isSaving to false when the save process is completed
    }
  };

  const handleSavePreferences = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Validate the required fields for preferences
        if (!studyTimes.trim() || !sessionDuration.trim()) {
          toast({
            title: "Validation Error",
            description:
              "Please fill in all the required fields (Preferred Study Times, Study Session Duration).",
            variant: "destructive",
          });
          return;
        }
        setIsSaving(true);
        const userDocRef = doc(db, "users", user.uid);

        const updatedPreferences = {
          preferences: {
            StudyTimes: studyTimes,
            StudySessionDuration: sessionDuration,
          },
        };

        await updateDoc(userDocRef, updatedPreferences);

        toast({
          title: "Preferences Updated",
          description: "Your study preferences have been successfully updated.",
        });

        setIsEditingPreferences(false);
        setHasChanges(false);
      }
    } catch (error) {
      toast({
        title: "Error updating preferences",
        description:
          "An error occurred while updating your preferences, try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(event.target.value);
    setHasChanges(true);
  };

  const handleEditClick = () => {
    setIsEditing((prevIsEditing) => !prevIsEditing);
    setHasChanges(false);
  };

  const handleEditPreferencesClick = () => {
    setIsEditingPreferences((prevIsEditing) => !prevIsEditing);
  };
  return (
    <>
      <GoogleOAuthProvider clientId={clientId}>
        <div className="flex flex-col min-h-screen z-40">
          <div className="flex-1 overflow-auto p-4 space-y-4 mt-40 z-40">
            <Tabs className="w-4/5 mx-auto" defaultValue="info">
              <div className="mb-4">
                <h1 className="text-4xl font-bold">Settings</h1>
                <p className="text-gray-500">
                  Manage your account settings and preferences.
                </p>
              </div>
              <TabsList className="border-b">
                <TabsTrigger value="info">
                  <Icons.UserIcon className="w-6 h-5" />
                  Personal Information
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <Icons.PreferencesIcon className="w-6 h-5" /> Preferences
                </TabsTrigger>
                <TabsTrigger value="integrations">
                  <Icons.IntegrationIcon className="w-6 h-5" />
                  Integrations
                </TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                <Card className="p-6 space-y-4">
                  <CardHeader>
                    <CardTitle>Edit Personal Information</CardTitle>
                    <CardDescription>Update your name, email.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          placeholder="Enter your first name"
                          value={firstName}
                          onChange={(e) => handleInputChange(e, setFirstName)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          placeholder="Enter your last name"
                          value={lastName}
                          onChange={(e) => handleInputChange(e, setLastName)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="Enter your email"
                        type="email"
                        value={email}
                        onChange={(e) => handleInputChange(e, setEmail)}
                        disabled={!isEditing}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="ml-auto"
                      onClick={handleSaveInfo}
                      disabled={!hasChanges || isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      className="ml-4"
                      variant="outline"
                      onClick={handleEditClick}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="preferences">
                <Card className="p-6 space-y-4">
                  <CardHeader>
                    <CardTitle>Study Preferences</CardTitle>
                    <CardDescription>
                      Customize your preferred study times and session
                      durations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="study-times">Preferred Study Times</Label>
                      <Input
                        id="study-times"
                        placeholder="Ex: I prefer to study in the morning no after 9PM"
                        value={studyTimes}
                        onChange={(e) => handleInputChange(e, setStudyTimes)}
                        disabled={!isEditingPreferences}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-duration">
                        Study Session Duration
                      </Label>
                      <Input
                        id="session-duration"
                        placeholder="Ex: I like to have study sessions of 2 hours each"
                        value={sessionDuration}
                        onChange={(e) =>
                          handleInputChange(e, setSessionDuration)
                        }
                        disabled={!isEditingPreferences}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="ml-auto"
                      onClick={handleSavePreferences}
                      disabled={!isEditingPreferences}
                    >
                      Save
                    </Button>
                    <Button
                      className="ml-4"
                      variant="outline"
                      onClick={handleEditPreferencesClick}
                    >
                      {isEditingPreferences ? "Cancel" : "Edit"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="integrations">
                <Card className="p-6 space-y-4">
                  <CardHeader>
                    <CardTitle>Connect with your favorite apps</CardTitle>
                    <CardDescription>
                      Sync your favorite apps with SyllabusSync.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src="/Google_Calendar.png"
                          alt="Google Calendar Logo"
                          className="h-12 w-12"
                        />
                        <div>
                          <h3 className="text-lg font-semibold">
                            Google Calendar
                          </h3>
                          <p className="text-sm text-gray-500">
                            Sync your Google Calendar events with SyllabusSync,
                            and SyllabusSync events with Google Calendar.
                          </p>
                        </div>
                      </div>
                      <div className="ml-8">
                        {isGoogleCalendarSynced ? (
                          <Button disabled>Google Calendar Synced</Button>
                        ) : (
                          <AuthProvider>
                            <SignInButton />
                          </AuthProvider>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </GoogleOAuthProvider>
    </>
  );
}
