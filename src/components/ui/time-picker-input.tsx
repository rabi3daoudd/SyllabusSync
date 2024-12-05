"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: "hours" | "minutes" | "ampm";
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  onLeftFocus?: () => void;
  onRightFocus?: () => void;
}

export const TimePickerInput = React.forwardRef<
  HTMLInputElement,
  TimePickerInputProps
>(
  (
    { picker, date, setDate, onLeftFocus, onRightFocus, className, ...props },
    ref
  ) => {
    const [value, setValue] = React.useState<string>(() => {
      if (!date) return "";
      switch (picker) {
        case "hours":
          return String(date.getHours() % 12 || 12).padStart(2, "0");
        case "minutes":
          return String(date.getMinutes()).padStart(2, "0");
        case "ampm":
          return date.getHours() >= 12 ? "PM" : "AM";
        default:
          return "";
      }
    });

    // Update input when date changes externally
    React.useEffect(() => {
      if (!date) {
        setValue("");
        return;
      }
      switch (picker) {
        case "hours":
          setValue(String(date.getHours() % 12 || 12).padStart(2, "0"));
          break;
        case "minutes":
          setValue(String(date.getMinutes()).padStart(2, "0"));
          break;
        case "ampm":
          setValue(date.getHours() >= 12 ? "PM" : "AM");
          break;
      }
    }, [date, picker]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowLeft" && onLeftFocus) {
        e.preventDefault();
        onLeftFocus();
      }
      if (e.key === "ArrowRight" && onRightFocus) {
        e.preventDefault();
        onRightFocus();
      }
      if (picker === "ampm") {
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          setValue("AM");
          updateDate("AM");
        }
        if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          setValue("PM");
          updateDate("PM");
        }
      }
    };

    const updateDate = (newValue: string) => {
      if (!date) {
        const now = new Date();
        date = now;
      }
      const newDate = new Date(date);

      switch (picker) {
        case "hours": {
          const hours = parseInt(newValue);
          if (isNaN(hours) || hours < 1 || hours > 12) return;
          const isPM = date.getHours() >= 12;
          newDate.setHours(
            isPM ? (hours === 12 ? 12 : hours + 12) : hours === 12 ? 0 : hours
          );
          break;
        }
        case "minutes": {
          const minutes = parseInt(newValue);
          if (isNaN(minutes) || minutes < 0 || minutes > 59) return;
          newDate.setMinutes(minutes);
          break;
        }
        case "ampm": {
          const currentHours = date.getHours();
          const isPM = newValue === "PM";
          if (isPM && currentHours < 12) {
            newDate.setHours(currentHours + 12);
          } else if (!isPM && currentHours >= 12) {
            newDate.setHours(currentHours - 12);
          }
          break;
        }
      }
      setDate(newDate);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      if (picker === "ampm") {
        newValue = newValue.toUpperCase();
        if (newValue !== "AM" && newValue !== "PM") return;
      } else {
        newValue = newValue.replace(/\D/g, "").slice(0, 2);
      }

      setValue(newValue);
      updateDate(newValue);

      if (picker === "hours" && newValue.length === 2) {
        onRightFocus?.();
      }
      if (picker === "minutes" && newValue.length === 2) {
        onRightFocus?.();
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-[40px] text-center p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          picker === "ampm" && "w-[45px]",
          className
        )}
        {...(picker !== "ampm"
          ? {
              type: "number",
              min: picker === "hours" ? 1 : 0,
              max: picker === "hours" ? 12 : 59,
            }
          : {
              type: "text",
              maxLength: 2,
            })}
      />
    );
  }
);
