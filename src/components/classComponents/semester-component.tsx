import React, { useState } from "react"
import { Button } from "../ui/button"
import { format } from "date-fns";
import ClassComponent from "./class-component"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../ui/accordion.tsx"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer.tsx";
import { Input } from "../ui/input.tsx";
import { Label } from "../ui/label.tsx";

interface Assignment {
    name: string;
    day?: string;
    date?: Date;
    startingTime: string;
    finishingTime: string;
    location?: string;
    occurance: string;
}

interface Class {
    name: string;
    assignments: Assignment[];
}

interface SemesterComponentProps {
    index: number;
    name: string;
    startDate: Date;
    endDate: Date;
}



const SemesterComponent: React.FC<SemesterComponentProps> = ({ index, name, startDate, endDate }) => {
    const [className, setClassName] = useState("");
    const [classes, setClasses] = useState<Class[]>([]);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const updateClassAssignments = (className: string, newAssignment: Assignment) => {
        setClasses((prevClasses) =>
            prevClasses.map((classItem) =>
                classItem.name === className
                    ? {
                        ...classItem,
                        assignments: [...classItem.assignments, newAssignment],
                      }
                    : classItem
            )
        );
    };

    const handleClassNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setClassName(event.target.value);
    };

    const handleSubmit = () => {
        if (!className) {
            alert("Please fill in all fields.");
            return;
        }

        const isClassExist = classes.some(classInterface => classInterface.name === className);
        if (isClassExist) {
            alert("A class with the same name already exists in this semester.");
            return;
        }

        const newClass = {
            name: className,
            assignments: []

        };

        setClasses([...classes, newClass]);
        setClassName("");
        setIsDrawerOpen(false);
    };

    return (

        <AccordionItem className="mb-5" value={`item-${index}`}>
            <div className="bg-[#FFFFFF] rounded-md shadow-lg p-6 overflow-x-auto">
                <AccordionTrigger className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold mb-1">{name}</h1>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="flex justify-between items-center">
                        <p className="text-lg text-[#0C4D53] mb-2">{`${format(startDate, 'MMM do yyyy')} - ${format(endDate, 'MMM do yyyy')}`}</p>

                        <Drawer open={isDrawerOpen}>
                            <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                                <Button data-testid="add-class-button" className="bg-[#1FCAD9] text-[#FFFFFF]">+ Add Class</Button>
                            </DrawerTrigger>
                            <DrawerContent>
                                <DrawerHeader>
                                    <DrawerTitle>Create a new class</DrawerTitle>
                                    <DrawerDescription>Enter all of the details of your class.</DrawerDescription>

                                    <Label>Name of Class:</Label>
                                    <Input id="className" placeholder="Enter Class Name" value={className} onChange={handleClassNameChange} required />

                                </DrawerHeader>
                                <DrawerFooter className="pt-2">
                                    <Button onClick={handleSubmit}>Submit</Button>
                                    <DrawerClose asChild>
                                        <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                    </div>
                    <div className="space-y-4">
                        <Accordion type="single" collapsible className="w-full">
                            {classes.map((classObject, classIndex) => (
                                <ClassComponent
                                    key={classIndex}
                                    index={classIndex + 1}
                                    name={classObject.name}
                                    assignments={classObject.assignments}
                                    setAssignments={(newAssignment) => updateClassAssignments(classObject.name, newAssignment)}
                                />
                            ))}
                        </Accordion>
                    </div>
                </AccordionContent>
            </div>
        </AccordionItem>
    );
}

export default SemesterComponent;
