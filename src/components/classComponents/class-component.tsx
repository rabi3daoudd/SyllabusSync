

import React, {useState } from "react"
import { Button } from "../ui/button"

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"

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
import {CalendarIcon } from "lucide-react";
import {Calendar} from "../ui/calendar"
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import AssignmentComponent from "./assignment-component";



interface ClassComponentProps{
    index:number;
    name:string;
    assignments: Assignment[]; 
    setAssignments: (newAssignment: Assignment) => void;
}


interface Assignment{
    name:string,
    day?:string,
    date?:Date,
    startingTime:string,
    finishingTime:string,
    location?:string,
    occurance:string
}


const ClassComponent: React.FC<ClassComponentProps> = ({index,name,assignments,setAssignments}) => {

    const [assignmentName, setAssignmentName] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [locationName,setLocationName] = useState("");
    const [occurance,setOccurance] = useState("");
    const [day, setDay] = useState("");
    const [date, setDate] = React.useState<Date>();

    const [startingTimeHour,setStartingTimeHour] = useState("");
    const [startingTimeMinute, setStartingTimeMinute] = useState("");
    const [startingTimeAmOrPm, setStartingTimeAmOrPm] = useState("");
    const [finishingTimeAmOrPm, setFinishingTimeAmOrPm] = useState("");
    const [finishingTimeHour,setFinishingTimeHour] = useState("");
    const [finishingTimeMinute, setFinishingTimeMinute] = useState("");
    const [startingTime, setStartingTime] = React.useState("");
    const [finishingTime, setFinishingTime] = React.useState("");

    

    const handleDayChange = (newValue: string) =>{
        setDay(newValue);
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

    const handleSubmit = () => {
        
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
        const isAssignmentExist = assignments.some(assignment => assignment.name === assignmentName && assignment.day === day && assignment.startingTime === startingTime && assignment.finishingTime === finishingTime && assignment.occurance === occurance && assignment.location === locationName && assignment.date === date );
        if (isAssignmentExist) {
            alert("A assignment with the same attributes already exists.");
            return;
        }
        const newAssignment = {
          name: assignmentName,
          day:day,
          date: date,
          startingTime:startingTime,
          finishingTime:finishingTime,
          location:locationName,
          occurance:occurance
          
        };
        setAssignments(newAssignment);
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
    };

    const handleOccuranceChange = (value: string) =>{
        setOccurance(value); 
    }

    return (
        
        <AccordionItem value={`item-${index}`}>
            <div className="space-y-4">
                <div className="bg-[#127780] rounded-lg p-4 mt-4 overflow-x-auto">
                    <AccordionTrigger >
                        <h1 className="text-2xl font-semibold text-[#FFFFFF] text-left mt-[-8px]">{name}</h1>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Drawer open={isDrawerOpen}>
                            <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                                <div className="flex justify-between items-center mb-4">
                                    <Button className="bg-[#FFFFFF] text-[#127780] text-sm">+ Add New</Button>
                                </div>
                            </DrawerTrigger>
                            
                            <DrawerContent>
                                <DrawerHeader>
                                    <DrawerTitle>Create a new assignment</DrawerTitle>
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
                                                <SelectTrigger className="w-[120px]"> {/* Adjusted width for tighter fit */}
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
                                            <Select value={startingTimeMinute} onValueChange={handleStartingTimeMinuteChange}>
                                                <SelectTrigger className="w-[120px]"> {/* Adjusted width for tighter fit */}
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
                                            <Select value={startingTimeAmOrPm} onValueChange={handleStartingTimeAmOrPmChange}>
                                                <SelectTrigger className="w-[120px]"> {/* Adjusted width for tighter fit */}
                                                    <SelectValue placeholder="AM OR PM" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AM">AM</SelectItem>
                                                    <SelectItem value="PM">PM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Label>Finishing Time:</Label>
                                        <div className="flex items-center">
                                            <Select value={finishingTimeHour} onValueChange= {handleFinishingTimeHourChange}>
                                                <SelectTrigger className="w-[120px]"> {/* Adjusted width for tighter fit */}
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
                                                <SelectTrigger className="w-[120px]"> {/* Adjusted width for tighter fit */}
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
                                                <SelectTrigger className="w-[120px]"> {/* Adjusted width for tighter fit */}
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
                                    <Input id="locationName" placeholder="Enter Assignment Name" value={locationName} onChange={handleLocationNameChange}  />

                                </DrawerHeader>
                                <DrawerFooter className="pt-2">
                                    <Button onClick={handleSubmit}>Submit</Button>
                                    <DrawerClose asChild>
                                        <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
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
                                day={assignmentObject.day}
                                date={assignmentObject.date}
                                startingTime={assignmentObject.startingTime}
                                finishingTime={assignmentObject.finishingTime}
                                location={assignmentObject.location}
                                occurance={assignmentObject.occurance}
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

