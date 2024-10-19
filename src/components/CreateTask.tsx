import React, { FormEvent, useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Button } from './ui/button';
import { taskSchema } from "./../data/schema"
import { z } from "zod"
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, } from './ui/drawer';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


type Task = z.infer<typeof taskSchema>;

interface CreateTaskProps {
    onNewTask: (newTask: Task) => void;
    onUpdateTask: (updatedTask: Task) => void;
    userClasses: string[];
    task?: Task;
    mode: "create" | "edit";
    isOpen: boolean;
    onClose: () => void;
}

export const CreateTask: React.FC<CreateTaskProps> = ({  
    onNewTask,
    onUpdateTask,
    userClasses,
    task,
    mode,
    isOpen,
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
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        let newTaskIdNumber = 1; // Start with 1 if no tasks exist

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const existingTasks = userData.tasks || [];

            // Find the highest task ID number
            const highestId = existingTasks.reduce((maxId: number, task: Task) => {
                const taskIdNumber = parseInt(task.id.replace('TASK-', ''));
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
          // Existing code for creating a task
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
            onNewTask(newTask);
            onClose(); // Close the drawer
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

          if (label !== undefined) {
            updatedTask.label = label;
          }
          
          if (dueDate !== undefined) {
            updatedTask.dueDate = dueDate ? dueDate.toISOString() : null;
          }
      
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
              onClose(); // Close the drawer
            }
          } catch (error) {
            console.error("Error updating task: ", error);
          }
        }
      };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent>
                <DrawerHeader>
                <DrawerTitle>{mode === "create" ? "Enter the Task Information" : "Edit Task"}</DrawerTitle>
                </DrawerHeader>
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div className="flex flex-col">
                            <label htmlFor="title" className="mb-2 font-semibold">Task Title</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter Task Title"
                                required
                                className="px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="status" className="mb-2 font-semibold">Status</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="todo">To Do</option>
                                <option value="in progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="label" className="mb-2 font-semibold">Label</label>
                            <select
                                id="label"
                                value={label ?? ""}
                                onChange={(e) => setLabel(e.target.value || undefined)}
                                className="px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">No label</option>
                                {userClasses.map((className) => (
                                <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                            </div>
                        <div className="flex flex-col">
                            <label htmlFor="priority" className="mb-2 font-semibold">Priority</label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                        <label htmlFor="dueDate" className="mb-2 font-semibold">
                            Due Date (Optional)
                        </label>
                        <DatePicker
                            selected={dueDate}
                            onChange={(date: Date | null) => setDueDate(date)}
                            dateFormat="yyyy-MM-dd"
                            className="px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholderText="Select a due date"
                            isClearable
                            required={false}
                        />
                        </div>

                        <Button type="submit" className="w-full">
                            {mode === "create" ? "Create Task" : "Save"}
                        </Button>
                    </form>
                </div>
                <DrawerFooter>
                    <DrawerClose>
                        <Button variant="outline" onClick={onClose}>Done</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
