"use client"; 

import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";

import SemesterComponent from "@/components/classComponents/semester-component"
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {semesterSchema} from "../../data/classesSchema";
import { onAuthStateChanged } from "firebase/auth";
import { z } from "zod"
import { useRouter } from "next/navigation";
import { auth, db } from '../../firebase-config';
import { doc, updateDoc, arrayUnion, getDoc, Timestamp } from 'firebase/firestore';


const ClassPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 120),
  });

  type Semester = z.infer<typeof semesterSchema>;
  const [semesterName, setSemesterName] = useState("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
      setLoading(true);  // Set loading to true at the start
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
    
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              const validatedSemesters = z
                  .array(semesterSchema)
                  .parse(userData.semesters || []);
              setSemesters(validatedSemesters);
            } else {
              console.error("No user document found!");
            }        
          } catch (error: unknown) {
            if (error instanceof Error) {
              setError(error);
            } else {
              setError(new Error("An error occurred while fetching semesters"));
            }
            console.error("Failed to fetch semesters:", error);
          } finally {
            setLoading(false);  // Set loading to false after data is fetched
          }
        } else {
          router.push("/login");
        }
      });
    
      return unsubscribe;
    }, []);

  if (loading) {
      return <div>Loading semesters...</div>;
  }

  if (error) {
      return <div>Failed to load semesters</div>;
  }

  const handleSemesterNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSemesterName(event.target.value);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;

    if (!user) {
        console.error("No user logged in!");
        return;
    }

    if (!semesterName || !dateRange?.from || !dateRange?.to) {
      alert("Please fill in all fields.");
      return;
    }
    const isSemesterExist = semesters.some((semester) => semester.name === semesterName);
    if (isSemesterExist) {
      alert("A semester with the same name already exists.");
      return;
    }
    const newSemester = {
      name: semesterName,
      start: dateRange.from,
      end: dateRange.to
    };
    try{

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
          semesters: arrayUnion(newSemester),
      });

      setSemesters([...semesters, newSemester]);
      // Clear the form
      setSemesterName("");
      setDateRange({ from: new Date(), to: addDays(new Date(), 120) });
      setIsDrawerOpen(false);

    } catch (error) {
      // Handle the error
      console.error("Error adding semester: ", error);
    }
    
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow py-8 mt-20 z-40">
          <Drawer open={isDrawerOpen}>
            {semesters.length === 0 ? (
              <div className="text-center mt-30">
                <p className="text-lg font-semibold mb-4">
                  You haven't added any classes or semesters yet. Let's make one!
                </p>
                <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                  <Button variant="outline" className="bg-[#1FCAD9] text-[#FFFFFF]">
                    Create Semester
                  </Button>
                </DrawerTrigger>
              </div>
            ) : (
              <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                <Button variant="outline" className="bg-[#1FCAD9] text-[#FFFFFF] mb-6 mt-30">
                  + New Semester
                </Button>
              </DrawerTrigger>
            )}

            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Create a new semester</DrawerTitle>
                <DrawerDescription>Enter all of the details of your semester.</DrawerDescription>

                <Label>Name of Semester:</Label>
                <Input
                  id="semesterName"
                  placeholder="Enter Semester Name"
                  value={semesterName}
                  onChange={handleSemesterNameChange}
                  required
                />
                <Label>Semester start and end dates:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </DrawerHeader>
              <DrawerFooter className="pt-2">
                <Button onClick={handleSubmit}>Submit</Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <Accordion type="single" collapsible className="w-full mt-10">
            {semesters.map((semester, index) => (
              <SemesterComponent
                key={semester.name}
                index={index + 1}
                name={semester.name}
                startDate={semester.start}
                endDate={semester.end}
              />
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
};

export default ClassPage;
