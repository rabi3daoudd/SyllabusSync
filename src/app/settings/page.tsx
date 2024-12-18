"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase-config";
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
import { useToast } from "@/hooks/use-toast";
import { AuthProvider } from "@/components/AuthContext";
import SignInButton from "@/components/SignInButton";
import AppearanceSettings from "./components/appearance-settings";

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
  const [accentColor, setAccentColor] = useState<string>("");

  const { toast } = useToast(); // Use the useToast hook to show toasts

  // Add this type near the top of the file
  type ColorConfig = {
    name: string;
    value: string;
    foreground: string;
  };

  // Add this constant for color options
  const colors: ColorConfig[] = [
    {
      name: "Blue",
      value: "blue",
      foreground: "hsl(212 100% 47%)",
    },
    {
      name: "Green",
      value: "green",
      foreground: "hsl(142 76% 36%)",
    },
    {
      name: "Purple",
      value: "purple",
      foreground: "hsl(272 51% 54%)",
    },
    {
      name: "Red",
      value: "red",
      foreground: "hsl(346 84% 46%)",
    },
  ];

  const handleColorChange = async (value: string) => {
    console.log("Changing accent color to:", value); // Debug log
    setAccentColor(value);

    // Update CSS variable
    const color = colors.find((c) => c.value === value)?.foreground;
    if (color) {
      document.documentElement.style.setProperty("--accent", color);
      document.documentElement.style.setProperty(
        "--accent-foreground",
        "white"
      );
    }

    // Save to Firestore
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          color: value,
        });
      }
    } catch (error) {
      console.error("Error saving accent color:", error);
    }
  };

  useEffect(() => {
    const loadAccentColor = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().color) {
          handleColorChange(userDoc.data().color);
        }
      }
    };
    loadAccentColor();
  }, []);

  useEffect(() => {
    // Fetch the user data from Firestore when the component mounts and set the state
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

  // Function to handle saving the user data to Firestore
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

  // Function to handle saving the user preferences to Firestore
  const handleSavePreferences = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Validate the required fields for preferences
        if (!studyTimes.trim() || !sessionDuration.trim()) {
          // Show a toast message if the required fields are not filled
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
        // Fetch the updated user data from Firestore
        toast({
          title: "Preferences Updated",
          description: "Your study preferences have been successfully updated.",
        });

        setIsEditingPreferences(false);
        setHasChanges(false);
      }
    } catch (error) {
      // Show a toast message if an error occurs while updating the preferences
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

  // Function to handle input change and set hasChanges to true
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(event.target.value);
    setHasChanges(true);
  };

  // Function to handle edit click and toggle isEditing state
  const handleEditClick = () => {
    setIsEditing((prevIsEditing) => !prevIsEditing);
    setHasChanges(false);
  };

  // Function to handle edit preferences click and toggle isEditingPreferences state
  const handleEditPreferencesClick = () => {
    setIsEditingPreferences((prevIsEditing) => !prevIsEditing);
  };
  return (
    <>
      <GoogleOAuthProvider clientId={clientId}>
        <div className="flex flex-col min-h-screen z-40">
          <div className="flex-1 overflow-auto p-4 space-y-4 z-40">
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
                <TabsTrigger value="appearance">
                  <Icons.PaintBrushIcon className="w-6 h-5" />
                  Appearance
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
                          <div className="space-x-2">
                            <Button disabled>Google Calendar Synced</Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsGoogleCalendarSynced(false);
                              }}
                            >
                              Resync
                            </Button>
                          </div>
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
              <TabsContent value="appearance">
                <AppearanceSettings
                  accentColor={accentColor}
                  handleColorChange={handleColorChange}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </GoogleOAuthProvider>
    </>
  );
}