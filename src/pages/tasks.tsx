import { CreateTask } from "@/components/CreateTask";
import { columns } from "@/components/datatable/columns";
import { DataTable } from "@/components/datatable/data-table";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Metadata } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { auth, db } from "../firebase-config";
import { taskSchema } from "./../data/schema";

import "../app/globals.css";

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
};

type TaskPageProps = {
  tasks: z.infer<typeof taskSchema>[];
};
type Task = z.infer<typeof taskSchema>;

function TaskPage() {
  const [tasks, setTasks] = useState<TaskPageProps["tasks"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch the tasks from Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const validatedTasks = z
              .array(taskSchema)
              .parse(userData.tasks || []);
            setTasks(validatedTasks);
          } else {
            console.error("No user document found!");
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            setError(error);
          } else {
            setError(new Error("An error occurred while fetching tasks"));
          }
          console.error("Failed to fetch tasks:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Redirect to login
        router.push("/login");
      }
    });

    return unsubscribe;
  }, []);

  const handleNewTask = (newTask: Task) => {
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
      <div className="flex justify-center w-4/5 mx-auto z-40">
        <div className="flex-1 flex-col space-y-8 mt-30 p-8 md:flex z-40">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back!
              </h2>
              <p className="text-muted-foreground">
                Here&apos;s a list of your tasks!
              </p>
            </div>
            <CreateTask onNewTask={handleNewTask} />
          </div>
          <DataTable data={tasks} columns={columns} />
        </div>
      </div>
    </>
  );
}

export default TaskPage;
