import { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Metadata } from "next"
import Image from "next/image"
import { z } from "zod"

import { columns } from "@/components/datatable/columns"
import { DataTable } from "@/components/datatable/data-table"
import { UserNav } from "@/components/datatable/user-nav"
import { taskSchema } from "./../data/schema"
import { CardHeader } from "@/components/ui/card"
import { CreateTask } from '@/components/CreateTask';
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
    title: "Tasks",
    description: "A task and issue tracker build using Tanstack Table.",
}

type TaskPageProps = {
    tasks: z.infer<typeof taskSchema>[];
};
type Task = z.infer<typeof taskSchema>;

function TaskPage() {
    const [tasks, setTasks] = useState<TaskPageProps['tasks']>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetch the tasks from Firestore
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        const validatedTasks = z.array(taskSchema).parse(userData.tasks || []);
                        setTasks(validatedTasks);
                    } else {
                        console.error('No user document found!');
                    }
                } catch (error : unknown) {
                    if (error instanceof Error) {
                        setError(error);
                    } else {
                        setError(new Error("An error occurred while fetching tasks"));
                    }
                    console.error('Failed to fetch tasks:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                // Redirect to login
            }
        });

        return unsubscribe;
    }, []);

    const handleNewTask = (newTask : Task) => {
        setTasks((currentTasks) => [...currentTasks, newTask]);
    };

    if (loading) {
        return <div>Loading tasks...</div>;
    }

    if (error) {
        return <div>Failed to load tasks</div>;
    }


    return (
        <>
            <div className="md:hidden">
                <Image
                    src="/examples/tasks-light.png"
                    width={1280}
                    height={998}
                    alt="Playground"
                    className="block dark:hidden"
                />
                <Image
                    src="/examples/tasks-dark.png"
                    width={1280}
                    height={998}
                    alt="Playground"
                    className="hidden dark:block"
                />
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <CardHeader className="text-center">
                            <Link href="/">
                                <Button className="w-full">Go back to home page</Button>
                            </Link>
                        </CardHeader>
                        <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
                        <p className="text-muted-foreground">
                            Here&apos;s a list of your tasks for this month!
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <UserNav />
                    </div>
                </div>
                <CreateTask  onNewTask={handleNewTask} />
                <DataTable data={tasks} columns={columns} />
            </div>
        </>
    )
}

export default TaskPage;




