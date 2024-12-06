import React, { FormEvent, useEffect, useState } from "react";
import { auth, db } from "../firebase-config";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Button } from "./ui/button";
import { taskSchema } from "./../data/schema";
import { z } from "zod";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Task = z.infer<typeof taskSchema>;

interface CreateTaskProps {
  onNewTask: (newTask: Task) => void;
  onUpdateTask: (updatedTask: Task) => void;
  userClasses: string[];
  task?: Task;
  mode: "create" | "edit";
  onClose: () => void;
}

export const CreateTask: React.FC<CreateTaskProps> = ({
  onNewTask,
  onUpdateTask,
  userClasses,
  task,
  mode,
  onClose,
}) => {
  const [title, setTitle] = useState(task ? task.title : "");
  const [status, setStatus] = useState(task ? task.status : "todo");
  const [priority, setPriority] = useState(task ? task.priority : "medium");
  const [label, setLabel] = useState<string | undefined | null>(
    task ? task.label : undefined
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    task && task.dueDate ? new Date(task.dueDate) : null
  );

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setStatus(task.status);
      setPriority(task.priority);
      setLabel(task.label);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    } else {
      setTitle("");
      setStatus("todo");
      setPriority("medium");
      setLabel(undefined);
      setDueDate(null);
    }
  }, [task]);

  async function generateTaskId(userId: string) {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    let newTaskIdNumber = 1; // Start with 1 if no tasks exist

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const existingTasks = userData.tasks || [];

      // Find the highest task ID number
      const highestId = existingTasks.reduce((maxId: number, task: Task) => {
        const taskIdNumber = parseInt(task.id.replace("TASK-", ""));
        return taskIdNumber > maxId ? taskIdNumber : maxId;
      }, 0);

      newTaskIdNumber = highestId + 1;
    }

    return `TASK-${newTaskIdNumber}`;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in!");
      return;
    }

    if (mode === "create") {
      const taskId = await generateTaskId(user.uid);
      const newTask = {
        id: taskId,
        title,
        status,
        priority,
        ...(label ? { label } : {}),
        ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
      };

      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          tasks: arrayUnion(newTask),
        });

        setTitle("");
        setStatus("todo");
        setPriority("medium");
        setLabel(undefined);
        setDueDate(null);
        onNewTask(newTask);
        onClose(); // Close the popover
      } catch (error) {
        console.error("Error adding task: ", error);
      }
    } else if (mode === "edit" && task) {
      const updatedTask = {
        ...task,
        title,
        status,
        priority,
        label: label !== undefined ? label : null,
        dueDate: dueDate ? dueDate.toISOString() : null,
      };

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const existingTasks: Task[] = userData.tasks || [];

          const updatedTasks = existingTasks.map((t) =>
            t.id === updatedTask.id ? updatedTask : t
          );

          await updateDoc(userDocRef, {
            tasks: updatedTasks,
          });

          onUpdateTask(updatedTask);
          onClose(); // Close the popover
        }
      } catch (error) {
        console.error("Error updating task: ", error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter Task Title"
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todo">To Do</option>
          <option value="in progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div>
        <Label htmlFor="label">Label</Label>
        <select
          id="label"
          value={label ?? ""}
          onChange={(e) => setLabel(e.target.value || undefined)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No label</option>
          {userClasses.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between",
                !dueDate && "text-muted-foreground"
              )}
            >
              <span>
                {dueDate
                  ? format(new Date(dueDate), "yyyy-MM-dd")
                  : "Select a due date"}
              </span>
              {dueDate && (
                <span
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the popover
                    setDueDate(null);
                  }}
                  className="cursor-pointer text-red-500"
                >
                  ✕
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate ? new Date(dueDate) : undefined}
              onSelect={(date) => {
                setDueDate(date ? date : null);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button type="submit" className="w-full">
        {mode === "create" ? "Create Task" : "Save"}
      </Button>
    </form>
  );
};
