// Use the client-side rendering strategy
"use client"

// Import necessary modules and components
import * as React from "react" // Import React for component creation
import { format } from "date-fns" // Import format function from date-fns for date formatting
import { Calendar as CalendarIcon } from "lucide-react" // Import CalendarIcon from lucide-react
import { cn } from "@/lib/utils" // Import cn utility for class name manipulation
import { Button } from "@/components/ui/button" // Import Button component
import { Calendar } from "@/components/ui/calendar" // Import Calendar component
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover" // Import Popover components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" // Import Select components

// Define the type for the props of the DatePickerWithPresets component
interface DatePickerWithPresetsProps {
  date: Date | undefined; // date prop will accept a Date object or undefined
  onChange: (date: Date | undefined) => void; // onChange prop will accept a function that takes a Date object or undefined
}

// Define the DatePickerWithPresets component
export function DatePickerWithPresets({ date, onChange }: DatePickerWithPresetsProps) {
  return (
    <Popover> 
      <PopoverTrigger asChild> 
        <Button 
          variant={"outline"} 
          className={cn(
            "w-[280px] justify-start text-left font-normal", 
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
        <Select
          onValueChange={(value) => {
            const daysToAdd = parseInt(value);
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + daysToAdd);
            onChange(newDate);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="0">Today</SelectItem>
            <SelectItem value="1">Tomorrow</SelectItem>
            <SelectItem value="3">In 3 days</SelectItem>
            <SelectItem value="7">In a week</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-md border">
          <Calendar mode="single" selected={date} onSelect={onChange} />
        </div>
      </PopoverContent>
    </Popover>
  )
}