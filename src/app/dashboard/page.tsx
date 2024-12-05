"use client"; 

import { useEffect, useState } from "react";
import { auth, db } from "../../firebase-config";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import {
  CardTitle,
  CardHeader,
  CardContent,
  Card,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "../../components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import MyCalendar from "@/components/MyCalendar";
import { fetchAllEventsFromAllCalendars } from "@/components/api";
import Link from "next/link";
import "@/app/globals.css";
import { motion } from "framer-motion";

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

interface TimeBasedGreeting {
  message: string;
  subMessage: string;
}

function getTimeBasedGreeting(): TimeBasedGreeting {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 8) {
    return {
      message: ", Early bird catches the A+",
      subMessage: "Impressive! You're up before most of your textbooks."
    };
  } else if (hour >= 8 && hour < 12) {
    return {
      message: ", Morning knowledge seeker!",
      subMessage: "Your brain is fresh and ready to download new information."
    };
  } else if (hour >= 12 && hour < 15) {
    return {
      message: ", Afternoon achiever!",
      subMessage: "Push through that food coma - your future self will thank you!"
    };
  } else if (hour >= 15 && hour < 17) {
    return {
      message: ", Mid-afternoon mastermind!",
      subMessage: "Coffee in one hand, determination in the other. You've got this!"
    };
  } else if (hour >= 17 && hour < 20) {
    return {
      message: ", Evening excellence!",
      subMessage: "Study session or Netflix? Choose wisely, future graduate!"
    };
  } else if (hour >= 20 && hour < 23) {
    return {
      message: ", Night owl navigator!",
      subMessage: "Late night studying? Remember: sleep is not just a suggestion!"
    };
  } else {
    return {
      message: ", Midnight scholar!",
      subMessage: "If you're seeing this, either you're really dedicated or really behind on deadlines. Either way, we believe in you!"
    };
  }
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
            const firstName = userData.firstName || "";
            setUserName(firstName);
          }
        } else {
          setUserName(user.displayName.split(' ')[0]);
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
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <motion.h1 
                  className="text-4xl font-bold mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {userName}{getTimeBasedGreeting().message}
                </motion.h1>
                <motion.p
                  className="text-muted-foreground text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {getTimeBasedGreeting().subMessage}
                </motion.p>
              </motion.div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="h-full"
              >
                <Card className="w-full h-full rounded-xl flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Upnext Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
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
                            {upcomingEvent.start.toLocaleString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-2xl font-bold">No upcoming events</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="h-full"
              >
                <Card className="w-full h-full rounded-xl flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tasks Due Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
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
                      <div>
                        {tasks.length === 0 ? (
                          <div className="text-2xl font-bold">No tasks due</div>
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
                      </div>
                    )}
                  </CardContent>
                  {tasks.length > 3 && (
                    <CardFooter className="mt-auto">
                      <Link href="/tasks" className="w-full">
                        <Button className="w-full">View All Tasks</Button>
                      </Link>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
                className="h-full"
              >
                <Card className="w-full h-full rounded-xl flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Chat with SyllabusSync AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-2xl font-bold">Available 24/7</div>
                    <p className="text-xs text-muted-foreground">
                      Get instant help and support
                    </p>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <Link href="/chat" className="w-full">
                      <Button className="w-full">Start Chat</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
            <motion.div 
              className="w-5/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
            >
              <MyCalendar />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
