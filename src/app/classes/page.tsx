"use client";

import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";

import SemesterComponent from "@/components/classComponents/semester-component";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { semesterSchema } from "../../data/classesSchema";
import { onAuthStateChanged } from "firebase/auth";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase-config";
import { doc, updateDoc, arrayUnion, getDoc, Timestamp } from "firebase/firestore";

const ClassPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 120),
  });

  type Semester = z.infer<typeof semesterSchema>;
  const [semesterName, setSemesterName] = useState("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const semestersWithDates = (userData.semesters || []).map((semester: Semester) => ({
              ...semester,
              start: semester.start instanceof Timestamp ? semester.start.toDate() : new Date(semester.start),
              end: semester.end instanceof Timestamp ? semester.end.toDate() : new Date(semester.end),
            }));
            const validatedSemesters = z.array(semesterSchema).parse(semestersWithDates || []);
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
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return unsubscribe;
  }, []);

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
      end: dateRange.to,
    };

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        semesters: arrayUnion(newSemester),
      });

      setSemesters([...semesters, newSemester]);
      console.log("Updated semesters:", [...semesters, newSemester]);

      // Clear the form
      setSemesterName("");
      setDateRange({ from: new Date(), to: addDays(new Date(), 120) });
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error adding semester: ", error);
    }
  };

  const handleDeleteSemester = async (semesterName: string) => {
    const user = auth.currentUser;
  
    if (!user) {
      console.error("No user logged in!");
      return;
    }
  
    try {
      const userDocRef = doc(db, "users", user.uid);
  
      // Fetch user data
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.error("User document not found!");
        return;
      }
  
      const userData = userDocSnap.data();
  
      // Debug: Log existing semesters
      console.log("Semesters before filtering:", userData.semesters);
  
      // Filter out the semester to be deleted
      const updatedSemesters = (userData.semesters || []).filter(
        (semester: { name: string }) => semester.name !== semesterName
      );
  
      // Convert Firestore Timestamps to JavaScript Dates
      const validSemesters = updatedSemesters.map((semester: Semester) => {
        try {
          const validStart =
            semester.start instanceof Timestamp
              ? semester.start.toDate()
              : new Date(semester.start);
  
          const validEnd =
            semester.end instanceof Timestamp
              ? semester.end.toDate()
              : new Date(semester.end);
  
          // Ensure dates are valid
          if (isNaN(validStart.getTime()) || isNaN(validEnd.getTime())) {
            console.warn("Invalid dates found for semester:", semester);
            return null; // Exclude invalid semester
          }
  
          return {
            ...semester,
            start: validStart,
            end: validEnd,
          };
        } catch (error) {
          console.warn("Error parsing semester dates:", semester, error);
          return null; // Exclude semester if parsing fails
        }
      }).filter(Boolean); // Remove null entries
  
      // Debug: Log filtered semesters
      console.log("Valid semesters after filtering:", validSemesters);
  
      // Filter out classes and assignments associated with the deleted semester
      const updatedClasses = (userData.classes || []).filter(
        (classItem: { semesterName: string }) => classItem.semesterName !== semesterName
      );
      const updatedAssignments = (userData.assignments || []).filter(
        (assignment: { semesterName: string }) => assignment.semesterName !== semesterName
      );
  
      // Debug: Log filtered classes and assignments
      console.log("Classes after filtering:", updatedClasses);
      console.log("Assignments after filtering:", updatedAssignments);
  
      // Update Firestore with filtered data
      await updateDoc(userDocRef, {
        semesters: validSemesters,
        classes: updatedClasses,
        assignments: updatedAssignments,
      });
  
      // Update local state to reflect changes in the UI
      setSemesters(validSemesters as Semester[]);
  
      console.log(`Successfully deleted semester: ${semesterName}`);
    } catch (error) {
      console.error("Error deleting semester:", error);
    }
  };
  
  const handleEditSemester = (semester: Semester) => {
    setEditingSemester(semester);
    setSemesterName(semester.name);
    setDateRange({ from: semester.start, to: semester.end });
    setIsEditDrawerOpen(true);
  };

  const handleUpdateSemester = async () => {
    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in!");
      return;
    }

    if (!editingSemester || !dateRange?.from || !dateRange?.to) {
      alert("Please fill in all fields.");
      return;
    }
    const isDuplicateName = semesters.some(
      (semester) =>
        semester.name === semesterName && semester.name !== editingSemester.name
    );
    if (isDuplicateName) {
      alert("A semester with the same name already exists. Please choose a different name.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const updatedSemesters = semesters.map((semester) =>
        semester.name === editingSemester.name
          ? {
            ...editingSemester,
            name: semesterName,
            start: dateRange.from ?? new Date(),
            end: dateRange.to ?? new Date(),
          }
          : semester
      );
      await updateDoc(userDocRef, { semesters: updatedSemesters });
      setSemesters(updatedSemesters);
      setIsEditDrawerOpen(false);
      console.log(`Updated semester: ${semesterName}`);
    } catch (error) {
      console.error("Error updating semester: ", error);
    }
  };

  if (loading) {
    return <div>Loading semesters...</div>;
  }

  if (error) {
    return <div>Failed to load semesters</div>;
  }

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
                  <Button variant="outline">
                    Create Semester
                  </Button>
                </DrawerTrigger>
              </div>
            ) : (
              <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                <Button variant="outline">
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
                  onChange={(e) => setSemesterName(e.target.value)}
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

          {/* Edit Semester Drawer */}
          <Drawer open={isEditDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Edit Semester</DrawerTitle>
                <DrawerDescription>Update the details of your semester.</DrawerDescription>
                <Label>Name of Semester:</Label>
                <Input
                  id="editSemesterName"
                  placeholder="Enter Semester Name"
                  value={semesterName}
                  onChange={(e) => setSemesterName(e.target.value)}
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
                <Button onClick={handleUpdateSemester}>Save</Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={() => {
                      setIsEditDrawerOpen(false)
                      setSemesterName("")
                      setDateRange({ from: new Date(), to: addDays(new Date(), 120) });
                    }}>
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          {/* Semesters Accordion */}
          <Accordion type="single" collapsible className="w-full mt-10">
            {semesters.map((semester, index) => (
              <div key={semester.name} className="mb-4">
                <SemesterComponent
                  key={semester.name}
                  index={index + 1}
                  name={semester.name}
                  startDate={semester.start}
                  endDate={semester.end}
                  onEdit={() => handleEditSemester(semester)}
                  onDelete={() => handleDeleteSemester(semester.name)}
                />
              </div>
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
};

export default ClassPage;
