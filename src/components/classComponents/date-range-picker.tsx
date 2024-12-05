"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  date,
  onDateChange,
  className,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (range: DateRange | undefined) => {
      onDateChange(range);
      if (range?.from && range?.to) {
        setTimeout(() => setOpen(false), 100);
      }
    },
    [onDateChange]
  );

  return (
    <div 
      className={cn("grid gap-2 relative", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Popover 
        open={open} 
        onOpenChange={setOpen}
        modal={true}
      >
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
          side="bottom"
          sideOffset={8}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="border rounded-md"
            onMouseDown={(e) => e.preventDefault()}
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
              className="p-3"
              disabled={(date) => date < new Date()}
              fixedWeeks
              showOutsideDays={false}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
