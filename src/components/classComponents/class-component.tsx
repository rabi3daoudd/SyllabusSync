

import React, {useState, useEffect} from "react"
import { Button } from "../ui/button"

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"

import { auth, db } from '../../firebase-config';
import { doc, updateDoc, arrayUnion, getDoc, Timestamp, arrayRemove } from 'firebase/firestore';

import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "../ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {CalendarIcon, PencilIcon, TrashIcon } from "lucide-react";
import {Calendar} from "../ui/calendar"
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import AssignmentComponent from "./assignment-component";

import { z } from "zod"
import { useRouter } from "next/navigation";
import {assignmentSchema} from "../../data/classesSchema";
import { onAuthStateChanged } from "firebase/auth";


interface ClassComponentProps{
    index:number;
    name:string;
    semesterName:string;
    onEdit: () => void;
    onDelete: () => void;
    
    /*
    assignments: Assignment[]; 
    setAssignments: (newAssignment: Assignment) => void; LOL
    */
}



const ClassComponent: React.FC<ClassComponentProps> = ({index,name,semesterName,onEdit,onDelete}) => {
    type Assignment = z.infer<typeof assignmentSchema>
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [assignmentName, setAssignmentName] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [locationName,setLocationName] = useState("");
    const [occurance,setOccurance] = useState("");
    const [day, setDay] = useState("");
    const [date, setDate] = React.useState<Date>();
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

    const [startingTimeHour,setStartingTimeHour] = useState("");
    const [startingTimeMinute, setStartingTimeMinute] = useState("");
    const [startingTimeAmOrPm, setStartingTimeAmOrPm] = useState("");
    const [finishingTimeAmOrPm, setFinishingTimeAmOrPm] = useState("");
    const [finishingTimeHour,setFinishingTimeHour] = useState("");
    const [finishingTimeMinute, setFinishingTimeMinute] = useState("");
    const [startingTime, setStartingTime] = React.useState("");
    const [finishingTime, setFinishingTime] = React.useState("");
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);
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

                const assignmentsWithDates = (userData.assignments || []).map((assignment: Assignment) => ({
                    ...assignment,
                    date: assignment.date instanceof Timestamp
                    ? assignment.date.toDate() // Convert Firestore Timestamp to JavaScript Date
                    : assignment.date || undefined // Use existing Date or undefined if no date
                }));
                const validatedAssignments = z
                    .array(assignmentSchema)
                    .parse(assignmentsWithDates);
                const filteredAssignments = validatedAssignments.filter((cls) => cls.semesterName === semesterName && cls.className === name);
                setAssignments(filteredAssignments);
              } else {
                console.error("No user document found!");
              }        
            } catch (error: unknown) {
              if (error instanceof Error) {
                setError(error);
              } else {
                setError(new Error("An error occurred while fetching assignments"));
              }
              console.error("Failed to fetch assignments:", error);
            } finally {
              setLoading(false);  // Set loading to false after data is fetched
            }
          } else {
            router.push("/login");
          }
        });
      
        return unsubscribe;
      }, []);

    

    const handleDayChange = (newValue: string) =>{
        setDay(newValue);
    }

    if (loading) {
        return <div>Loading assignments...</div>;
    }

    if (error) {
        return <div>Failed to load assignments</div>;
    }


    const handleStartingTimeHourChange = (newValue: string) => {
        setStartingTimeHour(newValue);
        updateCombinedTime(newValue, startingTimeMinute,startingTimeAmOrPm, 0);
    };
    
    // And for startingTimeMinute, similarly adjusted
    const handleStartingTimeMinuteChange = (newValue: string) => {
        setStartingTimeMinute(newValue);
        updateCombinedTime(startingTimeHour, newValue, startingTimeAmOrPm, 0);
    };

    const handleFinishingTimeHourChange = (newValue: string) => {
        setFinishingTimeHour(newValue);
        updateCombinedTime(newValue, finishingTimeMinute, finishingTimeAmOrPm, 1);
    };
    
    // And for startingTimeMinute, similarly adjusted
    const handleFinishingTimeMinuteChange = (newValue: string) => {
        setFinishingTimeMinute(newValue);
        updateCombinedTime(finishingTimeHour, newValue, finishingTimeAmOrPm, 1);
    };

    const handleStartingTimeAmOrPmChange = (newValue: string) => {
        setStartingTimeAmOrPm(newValue);
        updateCombinedTime(startingTimeHour, startingTimeMinute, newValue, 0);
    };

    const handleFinishingTimeAmOrPmChange = (newValue: string) => {
        setFinishingTimeAmOrPm(newValue);
        updateCombinedTime(finishingTimeHour, finishingTimeMinute, newValue, 1);
    };

    function updateCombinedTime(hour: string, minute: string, amOrPm: string, flag: number) {

        const newDateString =  `${hour}:${minute}${amOrPm}`;
        if(flag === 0){
            setStartingTime(newDateString);
        }
        else{
            setFinishingTime(newDateString);
        }
     }

    const ChooseDayComponent = () =>{
        return(
            <>
            <Label>Choose Day:</Label>
            <RadioGroup value={day} onValueChange={handleDayChange}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Monday" id="r1" />
                    <Label htmlFor="r1">Monday</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Tuesday" id="r2" />
                    <Label htmlFor="r2">Tuesday</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Wednesday" id="r3" />
                    <Label htmlFor="r3">Wednesday</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Thursday" id="r4" />
                    <Label htmlFor="r4">Thursday</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Friday" id="r5" />
                    <Label htmlFor="r5">Friday</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Saturday" id="r6" />
                    <Label htmlFor="r6">Saturday</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Sunday" id="r7" />
                    <Label htmlFor="r7">Sunday</Label>
                </div>
            </RadioGroup>
            </>
        );
    
    };
    const ChooseDateComponent = () =>{
        return(
            <>
            <Label>Choose Date:</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    />
                </PopoverContent>
            </Popover>
            </>
        );
    
    };
    

    const handleAssignmentNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAssignmentName(event.target.value);
    };

    const handleLocationNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocationName(event.target.value);
    };

    function parseTimeString(timeString: string) {
        const regex = /^(\d{1,2}):(\d{2})(AM|PM)$/i;
        const matches = timeString.match(regex);
      
        if (matches) {
          const hour = matches[1];
          const minute = matches[2];
          const period = matches[3].toUpperCase();
          return { hour, minute, period };
        } else {
          throw new Error("Invalid time format. Expected format is HH:MMAM or HH:MMPM.");
        }
      }

    const handleEditAssignment = (assignmentToEdit: Assignment) => {
        setEditingAssignment(assignmentToEdit);
        setAssignmentName(assignmentToEdit.name);
        setDay(assignmentToEdit.day);

        const { hour: startingHour, minute: startingMinute, period: startingAmOrPm } = parseTimeString(assignmentToEdit.startingTime);
        setStartingTimeHour(startingHour)
        setStartingTimeMinute(startingMinute)
        setStartingTimeAmOrPm(startingAmOrPm)

        const { hour: finishingHour, minute: finishingMinute, period: finishingAmOrPm } = parseTimeString(assignmentToEdit.finishingTime);
        setFinishingTimeHour(finishingHour)
        setFinishingTimeMinute(finishingMinute)
        setFinishingTimeAmOrPm(finishingAmOrPm)

        if(assignmentToEdit.date){
            setDate(assignmentToEdit.date);
        }
        setOccurance(assignmentToEdit.occurance)
        setLocationName(assignmentToEdit.location)

        setIsDrawerOpen(true);
    };

    const handleSubmit = async () => {

        const user = auth.currentUser;
        if (!user) {
            console.error("No user logged in!");
            return;
        }
        
        if(!startingTimeHour || !startingTimeMinute || !finishingTimeHour || !finishingTimeMinute || !startingTimeAmOrPm || !finishingTimeAmOrPm ){
            alert("Please fill in the time fields.");
            return;
        }

        let startHour24;
        let finishHour24;
        
        if(startingTimeAmOrPm === "PM" && startingTimeHour !== "12"){
            startHour24 = parseInt(startingTimeHour) + 12;
        }
        else if(startingTimeAmOrPm === "AM" && startingTimeHour === "12"){
            startHour24 = 0;

        }
        else{
            startHour24 = parseInt(startingTimeHour);
        }

        if(finishingTimeAmOrPm === "PM" && finishingTimeHour !== "12"){
            finishHour24 = parseInt(finishingTimeHour)+12;
        }
        else if(finishingTimeAmOrPm === "AM" && finishingTimeHour === "12"){
            finishHour24 = 0;
        }
        else{
            finishHour24 = parseInt(finishingTimeHour);
        }

        const startTimeInMinutes = startHour24 * 60 + parseInt(startingTimeMinute);
        const finishTimeInMinutes = finishHour24*60 +parseInt(finishingTimeMinute);

        if (startTimeInMinutes >= finishTimeInMinutes) {
            alert("The starting time must be before the finishing time.");
            return;
        }

        if (!assignmentName) {
          alert("Please fill in the assignment name.");
          return;
        }
        if(!occurance){
            alert("Please fill in the occurance of the assignment.")
            return;
        }
        if((occurance === "OnceAWeek" || occurance === "OnceEveryTwoWeeks") && !day){
            alert("Please fill in the day that the assignment happens. Ex. Monday,Tuesday, etc.")
            return;
        }
        const isAssignmentExist = assignments.some((someAssignment) => someAssignment.name === assignmentName);
        if (isAssignmentExist) {
            alert("An assignment with the same name already exists in this class.");
            return;
        }

        const newAssignment = {
          semesterName: semesterName,
          className: name,
          name: assignmentName,
          day: occurance === "OneTime" ? "" : day,
          startingTime:startingTime,
          finishingTime:finishingTime,
          location:locationName,
          occurance:occurance,
          ...(occurance === "OneTime" && date ? { date } : {})
        };

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                assignments: arrayUnion(newAssignment),
            });
            setAssignments([...assignments, newAssignment]);
            // Clear the form
            setAssignmentName("");
            setDay("");
            setDate(undefined);
            setStartingTime("");
            setFinishingTime("");
            setStartingTimeHour("");
            setFinishingTimeHour("");
            setFinishingTimeMinute("");
            setStartingTimeMinute("");
            setStartingTimeAmOrPm("");
            setFinishingTimeAmOrPm("");
            setLocationName("");
            setOccurance("");
            setIsDrawerOpen(false);

        } catch (error) {
            // Handle the error
            console.error("Error adding class: ", error);
        }
    };

    const handleOccuranceChange = (value: string) =>{
        setOccurance(value); 
        setDay("");
        setDate(undefined);
    }

    const handleUpdateAssignment = async () => {
        if (!editingAssignment) return;
    
        const user = auth.currentUser;
    
        if (!user) {
          console.error("No user logged in!");
          return;
        }
        
        if(!startingTimeHour || !startingTimeMinute || !finishingTimeHour || !finishingTimeMinute || !startingTimeAmOrPm || !finishingTimeAmOrPm ){
            alert("Please fill in the time fields.");
            return;
        }

        let startHour24;
        let finishHour24;
        
        if(startingTimeAmOrPm === "PM" && startingTimeHour !== "12"){
            startHour24 = parseInt(startingTimeHour) + 12;
        }
        else if(startingTimeAmOrPm === "AM" && startingTimeHour === "12"){
            startHour24 = 0;

        }
        else{
            startHour24 = parseInt(startingTimeHour);
        }

        if(finishingTimeAmOrPm === "PM" && finishingTimeHour !== "12"){
            finishHour24 = parseInt(finishingTimeHour)+12;
        }
        else if(finishingTimeAmOrPm === "AM" && finishingTimeHour === "12"){
            finishHour24 = 0;
        }
        else{
            finishHour24 = parseInt(finishingTimeHour);
        }

        const startTimeInMinutes = startHour24 * 60 + parseInt(startingTimeMinute);
        const finishTimeInMinutes = finishHour24*60 +parseInt(finishingTimeMinute);

        if (startTimeInMinutes >= finishTimeInMinutes) {
            alert("The starting time must be before the finishing time.");
            return;
        }

        if (!assignmentName) {
          alert("Please fill in the assignment name.");
          return;
        }
        const isDuplicateAssignment = assignments.some(
            (assignment) =>
              assignment.name === assignmentName && assignment.name !== editingAssignment.name
          );
          if (isDuplicateAssignment) {
            alert("A assignment with the same name already exists in the class. Please choose a different name.");
            return;
          }
        if(!occurance){
            alert("Please fill in the occurance of the assignment.")
            return;
        }
        if((occurance === "OnceAWeek" || occurance === "OnceEveryTwoWeeks") && !day){
            alert("Please fill in the day that the assignment happens. Ex. Monday,Tuesday, etc.")
            return;
        }
        const newStartingTime = `${startingTimeHour}:${startingTimeMinute}${startingTimeAmOrPm}`
        const newFinishingTime = `${finishingTimeHour}:${finishingTimeMinute}${finishingTimeAmOrPm}`
    
        const updatedAssignment = {
          ...editingAssignment,
          name: assignmentName,
          day: occurance === "OneTime" ? "" : day,
          startingTime:newStartingTime,
          finishingTime:newFinishingTime,
          location:locationName,
          occurance:occurance,
          ...(occurance === "OneTime" && date ? { date } : {})
        };
    
        try {
          const userDocRef = doc(db, "users", user.uid);
    
          // Remove the old class
          await updateDoc(userDocRef, {
            assignments: arrayRemove(editingAssignment),
          });
    
          // Add the updated class
          await updateDoc(userDocRef, {
            assignments: arrayUnion(updatedAssignment),
          });
    
          setAssignments(
            assignments.map((assignment) =>
              assignment.name === editingAssignment.name ? updatedAssignment : assignment
            )
          );
          setEditingAssignment(null);
          setAssignmentName("");
          setDay("");
          if(date){
            setDate(undefined);

          }
          setStartingTime("");
          setFinishingTime("");
          setStartingTimeHour("");
          setFinishingTimeHour("");
          setFinishingTimeMinute("");
          setStartingTimeMinute("");
          setStartingTimeAmOrPm("");
          setFinishingTimeAmOrPm("");
          setLocationName("");
          setOccurance("");
          setIsDrawerOpen(false);
          console.log(`Updated assignment: ${updatedAssignment.name}`);
        } catch (error) {
          console.error("Error updating assignment: ", error);
        }
      };
      const handleDeleteAssignment = async (assignmentNameToDelete: string) => {
        const user = auth.currentUser;
    
        if (!user) {
          console.error("No user logged in!");
          return;
        }
    
        const assignmentToDelete = assignments.find((assignment) => assignment.name === assignmentNameToDelete);
        if (!assignmentToDelete) {
          console.error("Assignment not found!");
          return;
        }
    
        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            assignments: arrayRemove(assignmentToDelete),
          });
    
          setAssignments(assignments.filter((assignment) => assignment.name !== assignmentNameToDelete));
          console.log(`Deleted assignment: ${assignmentNameToDelete}`);
        } catch (error) {
          console.error("Error deleting assignment: ", error);
        }
      };

    return (
        
        <AccordionItem value={`item-${index}`}>
            <div className="space-y-4">
                <div className="rounded-lg p-4 mt-4 overflow-x-auto">
                    <AccordionTrigger >
                        <h1 className="text-2xl font-semibold text-left mt-[-8px]">{name}</h1>
                        <div className="flex space-x-2 items-center ml-auto">
                            <PencilIcon className="w-5 h-5 cursor-pointer" onClick={onEdit} />
                            <TrashIcon className="w-5 h-5 cursor-pointer" onClick={onDelete} />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Drawer open={isDrawerOpen}>
                            <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                                <div className="flex justify-between items-center mb-4">
                                    <Button className="text-sm">+ Add New</Button>
                                </div>
                            </DrawerTrigger>
                            
                            <DrawerContent>
                                <DrawerHeader>
                                    <DrawerTitle>
                                    {editingAssignment ? "Edit Assignment" : "Create a new assignment"}
                                    </DrawerTitle>
                                    <DrawerDescription>Enter all of the details of your assignment.</DrawerDescription>

                                    <Label>Name of Assignment:</Label>
                                    <Input id="assignmentName" placeholder="Enter Assignment Name" value={assignmentName} onChange={handleAssignmentNameChange} required />

                                    <Label>Select Frequency:</Label>
                                    <RadioGroup value= {occurance} onValueChange={handleOccuranceChange}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="OneTime" id="r1" />
                                            <Label htmlFor="r1">One Time Occurance</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="OnceAWeek" id="r2" />
                                            <Label htmlFor="r2">Once a week</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="OnceEveryTwoWeeks" id="r3" />
                                            <Label htmlFor="r3">Once every two weeks</Label>
                                        </div>
                                    </RadioGroup>
                                    {(occurance === 'OnceAWeek' || occurance === 'OnceEveryTwoWeeks') && <ChooseDayComponent />}
                                    {(occurance === 'OneTime') && <ChooseDateComponent />}

                                    <div className="flex items-center space-x-2">
                                        <Label>Starting Time:</Label>
                                        <div className="flex items-center">
                                            <Select value={startingTimeHour} onValueChange={handleStartingTimeHourChange}>
                                                <SelectTrigger className="w-[120px]" id="starting-time-hour" aria-label="Starting Time Hour"> {/* Adjusted width for tighter fit */}
                                                    <SelectValue placeholder="Hour" />
                                                </SelectTrigger>
                                                <SelectContent role= "listbox">
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((number) => (
                                                        <SelectItem key={number} value={String(number)} role="option" aria-label={String(number)}>
                                                            {number}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <span className="mx-2">:</span> {/* Colon between hour and minute */}
                                            <Select value={startingTimeMinute} onValueChange={handleStartingTimeMinuteChange}>
                                                <SelectTrigger className="w-[120px]" id="starting-time-minute" aria-label="Starting Time Minute"> {/* Adjusted width for tighter fit */}
                                                    <SelectValue placeholder="Minute" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 60 }, (_, i) => i).map((number) => ( // Changed to start at 0
                                                        <SelectItem key={number} value={String(number).padStart(2, '0')} role="option">
                                                            {String(number).padStart(2, '0')}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={startingTimeAmOrPm} onValueChange={handleStartingTimeAmOrPmChange}>
                                                <SelectTrigger className="w-[120px]" id="starting-time-am-pm" aria-label="Starting Time AM OR PM"> {/* Adjusted width for tighter fit */}
                                                    <SelectValue placeholder="AM OR PM" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AM" role="option">AM</SelectItem>
                                                    <SelectItem value="PM" role="option">PM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Label>Finishing Time:</Label>
                                        <div className="flex items-center">
                                            <Select value={finishingTimeHour} onValueChange= {handleFinishingTimeHourChange}>
                                                <SelectTrigger className="w-[120px]" id="finishing-time-hour" aria-label="Finishing Time Hour"> {/* Adjusted width for tighter fit */}
                                                    <SelectValue placeholder="Hour" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((number) => (
                                                        <SelectItem key={number} value={String(number)}>
                                                            {number}
                                                        </SelectItem>
                                                    ))}
                                                    
                                                </SelectContent>
                                            </Select>
                                            <span className="mx-2">:</span> {/* Colon between hour and minute */}
                                            <Select value={finishingTimeMinute} onValueChange= {handleFinishingTimeMinuteChange}>
                                                <SelectTrigger className="w-[120px]" id="finishing-time-minute" aria-label="Finishing Time Minute"> {/* Adjusted width for tighter fit */}
                                                    <SelectValue placeholder="Minute" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 60 }, (_, i) => i).map((number) => ( // Changed to start at 0
                                                        <SelectItem key={number} value={String(number).padStart(2, '0')}>
                                                            {String(number).padStart(2, '0')}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={finishingTimeAmOrPm} onValueChange={handleFinishingTimeAmOrPmChange}>
                                                <SelectTrigger className="w-[120px]" id="finishing-time-am-pm" aria-label="Finishing Time AM OR PM"> {/* Adjusted width for tighter fit */}
                                                    <SelectValue placeholder="AM OR PM" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AM">AM</SelectItem>
                                                    <SelectItem value="PM">PM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Label>Location:</Label>
                                    <Input id="locationName" placeholder="Enter Location Name" value={locationName} onChange={handleLocationNameChange}  />

                                </DrawerHeader>
                                <DrawerFooter className="pt-2">
                                    <Button onClick={editingAssignment ? handleUpdateAssignment : handleSubmit}>
                                    {editingAssignment ? "Update" : "Submit"}
                                    </Button>
                                    <DrawerClose asChild>
                                        <Button variant="outline"
                                        onClick={
                                            () => {
                                            setIsDrawerOpen(false);
                                            setEditingAssignment(null);
                                            setDay("");
                                            setDate(undefined);
                                            setAssignmentName("");
                                            setStartingTime("");
                                            setFinishingTime("");
                                            setStartingTimeHour("");
                                            setFinishingTimeHour("");
                                            setFinishingTimeMinute("");
                                            setStartingTimeMinute("");
                                            setStartingTimeAmOrPm("");
                                            setFinishingTimeAmOrPm("");
                                            setLocationName("");
                                            setOccurance("");

                                        }}
                                        >
                                        Cancel
                                        </Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                        <div className="grid grid-cols-5 gap-4">
                    
                            {assignments.map((assignmentObject, index) => (
                            <>
                                <AssignmentComponent 
                                index={index+1}
                                name={assignmentObject.name}
                                day={
                                    assignmentObject.occurance !== "OneTime"
                                      ? assignmentObject.day // Display day only for recurring assignments
                                      : ""
                                  }
                                  date={
                                    assignmentObject.occurance === "OneTime" && assignmentObject.date instanceof Date
                                      ? assignmentObject.date
                                      : undefined
                                  }
                                startingTime={assignmentObject.startingTime}
                                finishingTime={assignmentObject.finishingTime}
                                location={assignmentObject.location}
                                occurance={assignmentObject.occurance}
                                onEdit={() => handleEditAssignment(assignmentObject)}
                                onDelete={() => handleDeleteAssignment(assignmentObject.name)}
                                />
                                
                            </>
                            ))}
                        </div>
                        
                    </AccordionContent>
                </div>
            </div>

        </AccordionItem>
    );
}

export default ClassComponent;