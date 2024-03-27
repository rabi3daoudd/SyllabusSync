import React, { FormEvent, useState } from 'react';
import { auth, db } from '../firebase-config';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Button } from './ui/button';
import { taskSchema } from "./../data/schema"
import { z } from "zod"


const labels = [
    { id: 'documentation', name: 'Documentation' },
    { id: 'bug', name: 'Bug' },
    { id: 'feature', name: 'Feature' },
];
type Task = z.infer<typeof taskSchema>;

interface CreateTaskProps {
    onNewTask: (newTask: Task) => void;
}

export const CreateTask: React.FC<CreateTaskProps> = ({ onNewTask }) => {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('todo');
    const [priority, setPriority] = useState('medium');
    const [label, setLabel] = useState('documentation');

    const toggleForm = () => setShowForm(!showForm);

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

        const taskId = await generateTaskId(user.uid);
        const newTask = {
            id: taskId,
            title,
            status,
            priority,
            label,
        };

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                tasks: arrayUnion(newTask),
            });

            setTitle('');
            setStatus('todo');
            setPriority('medium');
            setLabel('');
            onNewTask(newTask);
        } catch (error) {
            // Handle the error
            console.error("Error adding task: ", error);
        }
    };

    return (
        <div>
            <Button onClick={toggleForm} className="mb-4">
                {showForm ? 'Cancel' : 'Create a Task'}
            </Button>
            {showForm &&
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {labels.map((label) => (
                                <option key={label.id} value={label.id}>{label.name}</option>
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

                    <Button type="submit" className="w-full">
                        Create Task
                    </Button>
                </form>
            }
        </div>
    );
};
