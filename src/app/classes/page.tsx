"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { addDays, format } from "date-fns";
import {
  Plus,
  ChevronRight,
  Pencil,
  Trash2,
  CalendarPlus,
  BookPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimePickerDemo } from "@/components/ui/time-picker-demo";
import { auth, db } from "../../firebase-config";
import { useToast } from "@/hooks/use-toast";
import {
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/classComponents/date-range-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface ScheduleItem {
  id: string;
  type: "Lecture" | "Tutorial" | "Lab";
  dayOfWeek: string;
  startTime: Date;
  endTime: Date;
  location: string;
  repeat: {
    every: number;
    unit: string;
  };
}


interface Exam {
  id: string;
  name: string;
  date: Date;
  time?: {
    hour: string;
    minute: string;
    amPm: string;
  };
}

interface Semester {
  id: string;
  name: string;
  start: Date;
  end: Date;
  classes: Class[];
}

interface Class {
  id: string;
  name: string;
  code: string;
  schedule: ScheduleItem[];
  exams: Exam[];
}

interface EditScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleItem: ScheduleItem;
  onSave: (updatedItem: ScheduleItem) => void;
  onDelete: () => void;
}

export default function CourseDashboard() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
    null
  );
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [, setLoading] = useState(true);
  const [isNewSemesterDialogOpen, setIsNewSemesterDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [newSemesterDateRange, setNewSemesterDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 120),
  });
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>();

  // New class dialog states
  const [isNewClassDialogOpen, setIsNewClassDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");

  // Add new state for schedule and exam dialogs
  const [isNewScheduleDialogOpen, setIsNewScheduleDialogOpen] = useState(false);
  const [isNewExamDialogOpen, setIsNewExamDialogOpen] = useState(false);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    type: "lecture",
    day: "monday",
    startTime: new Date(),
    endTime: new Date(),
    location: "",
    repeat: {
      every: 1,
      unit: "weeks" as const,
    },
  });

  // Exam form state
  const [examForm, setExamForm] = useState<{
    name: string;
    date: Date | undefined;
  }>({
    name: "",
    date: new Date(),
  });

  // Add this state for edit dialog
  const [editScheduleItem, setEditScheduleItem] = useState<ScheduleItem | null>(
    null
  );

  // Add this state near other state declarations
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  // Fetch semesters with real-time updates
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const semestersData = userData.semesters || [];

          try {
            // Transform the data with proper type safety
            const processedSemesters = semestersData.map(
              (semester: Partial<Semester>) => {
                // Safely transform dates with proper error handling
                const getValidDate = (dateInput: unknown): Date => {
                  if (dateInput instanceof Timestamp) {
                    return dateInput.toDate();
                  }
                  const parsedDate = new Date(dateInput as string | number);
                  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
                };

                return {
                  id: semester.id || String(Date.now()),
                  name: semester.name || "Unnamed Semester",
                  start: getValidDate(semester.start),
                  end: getValidDate(semester.end),
                  classes: (semester.classes || []).map(
                    (cls: Partial<Class>) => ({
                      id: cls.id || String(Date.now()),
                      name: cls.name || "Unnamed Class",
                      code: cls.code || "NO CODE",
                      schedule: (cls.schedule || []).map(
                        (item: Partial<ScheduleItem>) => ({
                          id: item.id || String(Date.now()),
                          type: item.type || "Lecture",
                          dayOfWeek: item.dayOfWeek || "Monday",
                          startTime: getValidDate(item.startTime),
                          endTime: getValidDate(item.endTime),
                          location: item.location || "TBD",
                          repeat: item.repeat || { every: 1, unit: "weeks" },
                        })
                      ),
                      exams: (cls.exams || []).map((exam: Partial<Exam>) => ({
                        id: exam.id || String(Date.now()),
                        name: exam.name || "Unnamed Exam",
                        date: getValidDate(exam.date),
                      })),
                    })
                  ),
                };
              }
            );

            setSemesters(processedSemesters);
            setLoading(false);
          } catch (error) {
            console.error("Error processing semester data:", error);
            toast({
              title: "Error",
              description: "Failed to process semester data. Please try again.",
              variant: "destructive",
            });
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error("Error fetching semesters:", error);
        toast({
          title: "Error",
          description: "Failed to fetch semesters. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);



  const handleSemesterSubmit = async () => {
    if (
      !newSemesterName.trim() ||
      !newSemesterDateRange?.from ||
      !newSemesterDateRange?.to
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to manage semesters.",
          variant: "destructive",
        });
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        let updatedSemesters = [...userData.semesters];

        if (isEditMode && selectedSemester) {
          // Update existing semester
          updatedSemesters = updatedSemesters.map((semester) =>
            semester.id === selectedSemester.id
              ? {
                  ...semester,
                  name: newSemesterName.trim(),
                  start: newSemesterDateRange.from,
                  end: newSemesterDateRange.to,
                }
              : semester
          );
        } else {
          // Add new semester
          updatedSemesters.push({
            id: Date.now().toString(),
            name: newSemesterName.trim(),
            start: newSemesterDateRange.from,
            end: newSemesterDateRange.to,
            classes: [],
          });
        }

        await updateDoc(userDocRef, {
          semesters: updatedSemesters,
        });

        toast({
          title: "Success",
          description: `Semester ${
            isEditMode ? "updated" : "created"
          } successfully!`,
        });

        // Reset form
        setNewSemesterName("");
        setNewSemesterDateRange({
          from: new Date(),
          to: addDays(new Date(), 120),
        });
        setIsNewSemesterDialogOpen(false);
        setSelectedSemester(null);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error managing semester:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          isEditMode ? "update" : "create"
        } semester. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSemester = async () => {
    if (!selectedSemester) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete a semester.",
          variant: "destructive",
        });
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const updatedSemesters = semesters.filter(
        (semester) => semester.id !== selectedSemester.id
      );

      await updateDoc(userDocRef, {
        semesters: updatedSemesters,
      });

      toast({
        title: "Success",
        description: "Semester deleted successfully!",
      });

      // Reset state
      setIsDeleteDialogOpen(false);
      setIsNewSemesterDialogOpen(false);
      setSelectedSemester(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error deleting semester:", error);
      toast({
        title: "Error",
        description: "Failed to delete semester. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddSemester = () => {
    setIsDropdownOpen(false);
    setIsNewSemesterDialogOpen(true);
  };

  const handleSemesterSelect = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    setIsNewClassDialogOpen(true);
    setIsDropdownOpen(false);
  };

  const handleNewClassSubmit = async () => {
    if (!selectedSemesterId || !newClassName.trim() || !newClassCode.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a class.",
          variant: "destructive",
        });
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedSemesters = userData.semesters.map(
          (semester: Semester) => {
            if (semester.id === selectedSemesterId) {
              return {
                ...semester,
                classes: [
                  ...semester.classes,
                  {
                    id: Date.now().toString(),
                    name: newClassName.trim(),
                    code: newClassCode.trim(),
                    schedule: [],
                    exams: [],
                  },
                ],
              };
            }
            return semester;
          }
        );

        await updateDoc(userDocRef, {
          semesters: updatedSemesters,
        });

        toast({
          title: "Success",
          description: "Class added successfully!",
        });

        // Reset form
        setNewClassName("");
        setNewClassCode("");
        setIsNewClassDialogOpen(false);
        setSelectedSemesterId(undefined);
      }
    } catch (error) {
      console.error("Error adding class:", error);
      toast({
        title: "Error",
        description: "Failed to add class. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Class selection handler
  const handleClassSelect = (class_: Class) => {
    setSelectedClass(class_);
  };

  // Semester editing handler
  const handleEditSemester = (semester: Semester) => {
    setSelectedSemester(semester);
    setNewSemesterName(semester.name);
    setNewSemesterDateRange({
      from: semester.start,
      to: semester.end,
    });
    setIsEditMode(true);
    setIsNewSemesterDialogOpen(true);
  };

  // Handle schedule form submission
  const handleAddScheduleItem = async () => {
    if (!selectedClass) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a schedule item.",
          variant: "destructive",
        });
        return;
      }

      // Validate times
      if (scheduleForm.startTime >= scheduleForm.endTime) {
        toast({
          title: "Invalid Times",
          description: "End time must be after start time.",
          variant: "destructive",
        });
        return;
      }

      const newScheduleItem: ScheduleItem = {
        id: Date.now().toString(),
        type: scheduleForm.type as "Lecture" | "Tutorial" | "Lab",
        dayOfWeek: scheduleForm.day,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        location: scheduleForm.location,
        repeat: {
          every: scheduleForm.repeat.every,
          unit: scheduleForm.repeat.unit,
        },
      };

      const updatedClass = {
        ...selectedClass,
        schedule: [...selectedClass.schedule, newScheduleItem],
      };

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedSemesters = userData.semesters.map(
          (semester: Semester) => ({
            ...semester,
            classes: semester.classes.map((cls) =>
              cls.id === selectedClass.id ? updatedClass : cls
            ),
          })
        );

        await updateDoc(userDocRef, {
          semesters: updatedSemesters,
        });

        setSelectedClass(updatedClass);
        setIsNewScheduleDialogOpen(false);
        setScheduleForm({
          type: "lecture",
          day: "monday",
          startTime: new Date(),
          endTime: new Date(),
          location: "",
          repeat: {
            every: 1,
            unit: "weeks" as const,
          },
        });

        toast({
          title: "Success",
          description: "Schedule item added successfully!",
        });
      }
    } catch (error) {
      console.error("Error adding schedule item:", error);
      toast({
        title: "Error",
        description: "Failed to add schedule item. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle exam form submission
  const handleAddExam = async () => {
    if (!selectedClass || !examForm.name || !examForm.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add an exam.",
          variant: "destructive",
        });
        return;
      }

      const exam: Exam = {
        id: Date.now().toString(),
        name: examForm.name,
        date: examForm.date,
      };

      const updatedClass = {
        ...selectedClass,
        exams: [...selectedClass.exams, exam],
      };

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedSemesters = userData.semesters.map(
          (semester: Semester) => ({
            ...semester,
            classes: semester.classes.map((cls) =>
              cls.id === selectedClass.id ? updatedClass : cls
            ),
          })
        );

        await updateDoc(userDocRef, {
          semesters: updatedSemesters,
        });

        setSelectedClass(updatedClass);
        setIsNewExamDialogOpen(false);
        setExamForm({
          name: "",
          date: undefined,
        });

        toast({
          title: "Success",
          description: "Exam added successfully!",
        });
      }
    } catch (error) {
      console.error("Error adding exam:", error);
      toast({
        title: "Error",
        description: "Failed to add exam. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditSchedule = async (updatedItem: ScheduleItem) => {
    if (!selectedClass) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to edit a schedule item.",
          variant: "destructive",
        });
        return;
      }

      const updatedSchedule = selectedClass.schedule.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      );

      const updatedClass = {
        ...selectedClass,
        schedule: updatedSchedule,
      };

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedSemesters = userData.semesters.map(
          (semester: Semester) => ({
            ...semester,
            classes: semester.classes.map((cls) =>
              cls.id === selectedClass.id ? updatedClass : cls
            ),
          })
        );

        await updateDoc(userDocRef, {
          semesters: updatedSemesters,
        });

        setSelectedClass(updatedClass);
        setEditScheduleItem(null);

        toast({
          title: "Success",
          description: "Schedule item updated successfully!",
        });
      }
    } catch (error) {
      console.error("Error updating schedule item:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (itemId: string) => {
    if (!selectedClass) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete a schedule item.",
          variant: "destructive",
        });
        return;
      }

      const updatedSchedule = selectedClass.schedule.filter(
        (item) => item.id !== itemId
      );

      const updatedClass = {
        ...selectedClass,
        schedule: updatedSchedule,
      };

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedSemesters = userData.semesters.map(
          (semester: Semester) => ({
            ...semester,
            classes: semester.classes.map((cls) =>
              cls.id === selectedClass.id ? updatedClass : cls
            ),
          })
        );

        await updateDoc(userDocRef, {
          semesters: updatedSemesters,
        });

        setSelectedClass(updatedClass);
        setEditScheduleItem(null);

        toast({
          title: "Success",
          description: "Schedule item deleted successfully!",
        });
      }
    } catch (error) {
      console.error("Error deleting schedule item:", error);
      toast({
        title: "Error",
        description: "Failed to delete schedule item. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-[280px] border-r bg-background">
        <div className="flex-grow py-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Semesters</h2>
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleAddSemester}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  New Semester
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <BookPlus className="mr-2 h-4 w-4" />
                    New Class
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={selectedSemesterId}
                      onValueChange={handleSemesterSelect}
                    >
                      {semesters.map((semester) => (
                        <DropdownMenuRadioItem
                          key={semester.id}
                          value={semester.id}
                        >
                          {semester.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            {semesters.map((semester) => (
              <Collapsible key={semester.id}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative w-full justify-start px-2 hover:bg-accent hover:text-accent-foreground group"
                  >
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    <span className="ml-2 truncate text-sm font-medium">
                      {semester.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSemester(semester);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit semester</span>
                    </Button>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="relative pl-4 mt-1 space-y-2">
                    <div className="absolute left-[13px] top-0 bottom-0 w-px bg-border" />
                    {semester.classes.map((class_) => (
                      <Button
                        key={class_.id}
                        variant="ghost"
                        className="relative w-full justify-start px-6 py-3 text-sm hover:bg-accent hover:text-accent-foreground group text-left"
                        onClick={() => handleClassSelect(class_)}
                      >
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-px bg-border group-hover:bg-accent" />
                        <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                          <span className="truncate font-semibold text-base text-left">
                            {class_.code}
                          </span>
                          <span className="truncate text-xs text-muted-foreground text-left">
                            {class_.name}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {selectedClass ? (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" onClick={() => setSelectedClass(null)}>
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">
                {selectedClass.code} - {selectedClass.name}
              </h1>
            </div>
            <div className="grid gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Schedule</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewScheduleDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule Item
                  </Button>
                </CardHeader>
                <CardContent>
                  {selectedClass.schedule.length === 0 ? (
                    <p className="text-muted-foreground">
                      No schedule items yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedClass.schedule.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.dayOfWeek} at{" "}
                              {format(item.startTime, "h:mm a")} -{" "}
                              {format(item.endTime, "h:mm a")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.location}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditScheduleItem(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setScheduleToDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Exams</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewExamDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exam
                  </Button>
                </CardHeader>
                <CardContent>
                  {selectedClass.exams.length === 0 ? (
                    <p className="text-muted-foreground">No exams scheduled</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedClass.exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{exam.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(exam.date, "PPP")}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-2xl font-bold mb-2">Select a Class</h1>
            <p className="text-muted-foreground">
              Choose a class from the sidebar to view its details
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog
        open={isNewClassDialogOpen}
        onOpenChange={setIsNewClassDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>
              Add a new class to{" "}
              {semesters.find((s) => s.id === selectedSemesterId)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Class Name
              </Label>
              <Input
                id="name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Introduction to Computer Science"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Class Code
              </Label>
              <Input
                id="code"
                value={newClassCode}
                onChange={(e) => setNewClassCode(e.target.value)}
                placeholder="CS101"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleNewClassSubmit}>Add Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isNewSemesterDialogOpen}
        onOpenChange={setIsNewSemesterDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit semester" : "Create a new semester"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the details of your semester."
                : "Enter the details of your new semester."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="semesterName" className="text-right">
                Name
              </Label>
              <Input
                id="semesterName"
                value={newSemesterName}
                onChange={(e) => setNewSemesterName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Fall 2024"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-6">
              <Label className="text-right">Dates</Label>
              <div className="col-span-3">
                <DatePickerWithRange
                  date={newSemesterDateRange}
                  onDateChange={(range) => {
                    if (range) {
                      setNewSemesterDateRange(range);
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {isEditMode && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Semester
              </Button>
            )}
            <Button onClick={handleSemesterSubmit}>
              {isEditMode ? "Save Changes" : "Create Semester"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Semester</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this semester? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSemester}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Schedule Item Dialog */}
      <Dialog
        open={isNewScheduleDialogOpen}
        onOpenChange={setIsNewScheduleDialogOpen}
      >
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Schedule Item</DialogTitle>
            <DialogDescription>
              Add a new schedule item to {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={scheduleForm.type}
                onValueChange={(value) =>
                  setScheduleForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="day" className="text-right">
                Day
              </Label>
              <Select
                value={scheduleForm.day}
                onValueChange={(value) =>
                  setScheduleForm((prev) => ({ ...prev, day: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <div className="col-span-3">
                <TimePickerDemo
                  date={scheduleForm.startTime}
                  setDate={(date) =>
                    date &&
                    setScheduleForm((prev) => ({ ...prev, startTime: date }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <div className="col-span-3">
                <TimePickerDemo
                  date={scheduleForm.endTime}
                  setDate={(date) =>
                    date &&
                    setScheduleForm((prev) => ({ ...prev, endTime: date }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={scheduleForm.location}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="Room 101"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Repeat</Label>
              <div className="col-span-3 flex items-center gap-2">
                <span>Every</span>
                <Input
                  type="number"
                  min={1}
                  value={scheduleForm.repeat.every}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      repeat: {
                        ...prev.repeat,
                        every: parseInt(e.target.value) || 1,
                      },
                    }))
                  }
                  className="w-20"
                />
                <Select
                  value={scheduleForm.repeat.unit}
                  onValueChange={(value: "weeks") =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      repeat: {
                        ...prev.repeat,
                        unit: value,
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="working days">Working Days</SelectItem>
                    <SelectItem value="odd days">Odd Days</SelectItem>
                    <SelectItem value="even days">Even Days</SelectItem>
                    <SelectItem value="odd working days">
                      Odd Working Days
                    </SelectItem>
                    <SelectItem value="even working days">
                      Even Working Days
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddScheduleItem}>Add Schedule Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Exam Dialog */}
      <Dialog open={isNewExamDialogOpen} onOpenChange={setIsNewExamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exam</DialogTitle>
            <DialogDescription>
              Add a new exam to {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="examName" className="text-right">
                Name
              </Label>
              <Input
                id="examName"
                value={examForm.name}
                onChange={(e) =>
                  setExamForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Midterm 1"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date</Label>
              <div className="col-span-3">
                <DatePicker
                  date={examForm.date}
                  onDateChange={(date) => {
                    if (date) {
                      setExamForm({ ...examForm, date });
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddExam}>Add Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editScheduleItem && (
        <EditScheduleDialog
          isOpen={!!editScheduleItem}
          onOpenChange={(open) => !open && setEditScheduleItem(null)}
          scheduleItem={editScheduleItem}
          onSave={handleEditSchedule}
          onDelete={() => handleDeleteSchedule(editScheduleItem.id)}
        />
      )}

      <AlertDialog
        open={!!scheduleToDelete}
        onOpenChange={(open) => !open && setScheduleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule item? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (scheduleToDelete) {
                  handleDeleteSchedule(scheduleToDelete);
                  setScheduleToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditScheduleDialog({
  isOpen,
  onOpenChange,
  scheduleItem,
  onSave,
  onDelete,
}: EditScheduleDialogProps) {
  const [form, setForm] = useState({
    ...scheduleItem,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Schedule Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  type: value as "Lecture" | "Tutorial" | "Lab",
                }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lecture">Lecture</SelectItem>
                <SelectItem value="Tutorial">Tutorial</SelectItem>
                <SelectItem value="Lab">Lab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="day" className="text-right">
              Day
            </Label>
            <Select
              value={form.dayOfWeek.toLowerCase()}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  dayOfWeek: value.charAt(0).toUpperCase() + value.slice(1),
                }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Start Time
            </Label>
            <div className="col-span-3">
              <TimePickerDemo
                date={form.startTime}
                setDate={(date) =>
                  date && setForm((prev) => ({ ...prev, startTime: date }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              End Time
            </Label>
            <div className="col-span-3">
              <TimePickerDemo
                date={form.endTime}
                setDate={(date) =>
                  date && setForm((prev) => ({ ...prev, endTime: date }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              onDelete();
            }}
          >
            Delete
          </Button>
          <Button
            onClick={() => {
              onSave(form);
              onOpenChange(false);
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
