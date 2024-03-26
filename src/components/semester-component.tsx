import React from "react"
import { Button } from "./ui/button"
import { addDays,format} from "date-fns";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion"

interface SemesterComponentProps{
    index:number;
    name:string;
    startDate:Date;
    endDate:Date;
}

const SemesterComponent: React.FC<SemesterComponentProps> = ({index,name,startDate,endDate}) => {
    return (
        
        <AccordionItem value={`item-${index}`}>
            <p>HELLO {index}</p>
            <div className="bg-[#FFFFFF] rounded-md shadow-lg p-6">
            <AccordionTrigger className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold mb-1">{name}</h1>
            </AccordionTrigger>
            <AccordionContent>
                <div className="flex justify-between items-center">
                    <p className="text-lg text-[#0C4D53] mb-2">{`${format(startDate, 'MMM do yyyy')} - ${format(endDate, 'MMM do yyyy')}`}</p>
                    <Button className="bg-[#1FCAD9] text-[#FFFFFF]">+ Add Class</Button>
                </div>
            </AccordionContent>
            </div>
        </AccordionItem>
    );
}

export default SemesterComponent;
