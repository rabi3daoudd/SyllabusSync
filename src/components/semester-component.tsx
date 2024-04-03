import React, { useState } from "react"
import { Button } from "./ui/button"
import { addDays,format} from "date-fns";
import ClassComponent from "./class-component.tsx"

import {
    Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Class{
    name:string;
}

interface SemesterComponentProps{
    index:number;
    name:string;
    startDate:Date;
    endDate:Date;
}



const SemesterComponent: React.FC<SemesterComponentProps> = ({index,name,startDate,endDate}) => {
    const [className, setClassName] = useState("");
    const [classes, setClasses] = useState<Class[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [open, setOpen] = React.useState(false);

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
            name: className
        };

        setClasses([...classes, newClass]);
        setClassName("");
        setIsDrawerOpen(false);
    };
    
    return (
        
        <AccordionItem value={`item-${index}`}>
            <div className="bg-[#FFFFFF] rounded-md shadow-lg p-6 overflow-x-auto">
            <AccordionTrigger className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold mb-1">{name}</h1>
            </AccordionTrigger>
            <AccordionContent>
                <div className="flex justify-between items-center">
                    <p className="text-lg text-[#0C4D53] mb-2">{`${format(startDate, 'MMM do yyyy')} - ${format(endDate, 'MMM do yyyy')}`}</p>

                    <Drawer open={isDrawerOpen}>
                        <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                            <Button className="bg-[#1FCAD9] text-[#FFFFFF]">+ Add Class</Button>
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
                        {classes.map((classObject, index) => (
                        <>
                            <ClassComponent index={index+1}
                            name={classObject.name}/>
                            
                        </>
                        ))}
                    </Accordion>
                </div>


                
            </AccordionContent>
            </div>
        </AccordionItem>
    );
}

export default SemesterComponent;
