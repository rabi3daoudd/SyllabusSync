"use client"; 

import { useEffect, useState } from "react";
import { auth, db } from "../firebase-config";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import {
  CardTitle,
  CardHeader,
  CardContent,
  Card,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "../components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import MyCalendar from "@/components/MyCalendar";
import { fetchAllEventsFromAllCalendars } from "@/components/api";
import Link from "next/link";
import "./globals.css";

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<CalendarEvent | null>(
    null
  );
  const [userName, setUserName] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName || "");

        if (!user.displayName) {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName =
              userData.firstName && userData.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : "";
            setUserName(fullName);
          }
        }

        // Fetch all events from all calendars
        const allEvents = await fetchAllEventsFromAllCalendars(user.uid);

        // Sort the events by start time in ascending order
        const sortedEvents = allEvents.sort(
          (a, b) => a.end.getTime() - b.end.getTime()
        );

        console.log("All events:", sortedEvents);
        // Find the first upcoming event
        const currentTime = new Date();
        const upcomingEvent = sortedEvents.find(
          (event) => event.start > currentTime
        );

        setUpcomingEvent(upcomingEvent || null);
        setIsLoading(false);
        // Fetch tasks from Firestore
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fetchedTasks = userData.tasks || [];
          setTasks(fetchedTasks);
        }
      } else {
        setUserEmail(null);
        setUserName(null);
        router.push("/login"); // Redirect to the login page if the user is not signed in
      }
    });

    return () => unsubscribe();
  }, []);

  if (!userEmail) {
    return null; // Don't render anything while checking the user's authentication status
  }

  const isEventHappeningNow = (event: CalendarEvent): boolean => {
    const currentTime = new Date();
    return currentTime >= event.start && currentTime <= event.end;
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow py-8 z-40">
          <div className="w-4/5 mx-auto">
            {userName && (
              <h1 className="text-5xl font-bold mb-5">
                Hello {userName}, Welcome back!
              </h1>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card className="w-full rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Upnext Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  ) : upcomingEvent ? (
                    <>
                      <div className="text-2xl font-bold">
                        {upcomingEvent.title}
                      </div>
                      {isEventHappeningNow(upcomingEvent) ? (
                        <p className="text-xs text-muted-foreground">
                          Happening Now
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {upcomingEvent.start.toLocaleString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No upcoming events
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="w-full rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tasks Due Soon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="w-32 h-4 rounded" />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="w-32 h-4 rounded" />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="w-32 h-4 rounded" />
                      </div>
                    </>
                  ) : (
                    <>
                      {tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center space-x-2 mt-1"
                        >
                          <Checkbox />
                          <span
                            className={`${
                              task.completed ? "line-through text-gray-500" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {tasks.length > 3 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {tasks.length - 3} more tasks...
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
                {tasks.length > 3 && (
                  <CardFooter>
                    <Link href="/tasks">
                      <Button className="w-full">View All Tasks</Button>
                    </Link>
                  </CardFooter>
                )}
              </Card>
              <Card className="w-full rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Chat with SyllabusSync AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Available 24/7</div>
                  <p className="text-xs text-muted-foreground">
                    Get instant help and support
                  </p>
                </CardContent>
                <CardFooter>
                  <Link
                    className="text-gray-800 hover:text-blue-500 py-2"
                    href="/chat"
                  >
                    <Button className="w-full">Start Chat</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
            <div className="w-5/5">
              <MyCalendar />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
