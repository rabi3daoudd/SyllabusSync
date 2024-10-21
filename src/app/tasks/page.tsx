"use client"; 

import { CreateTask } from "@/components/CreateTask";
import { columns } from "@/components/datatable/columns";
import { DataTable } from "@/components/datatable/data-table";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

import { auth, db } from "../../firebase-config";
import { taskSchema } from "./../../data/schema";

import "../globals.css";
import { Button } from "@/components/ui/button";


interface UserClass {
  name: string;
  semesterName: string;
  // Add other properties if necessary
}

type TaskPageProps = {
  tasks: z.infer<typeof taskSchema>[];
};
type Task = z.infer<typeof taskSchema>;

function TaskPage() {
  const [tasks, setTasks] = useState<TaskPageProps["tasks"]>([]);
  const [userClasses, setUserClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);


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

            const classesData = userData.classes || [];
            const classNames = classesData.map((cls: UserClass) => cls.name);
            setUserClasses(classNames);
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in!");
        return;
      }

      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error("Error updating task status: ", error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingTask(undefined);
    setDrawerMode("create");
  };

  const handleOpenCreateTask = () => {
    setEditingTask(undefined);
    setDrawerMode("create");
    setIsDrawerOpen(true);
};

  const handleDeleteTask = async (taskToDelete: Task) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in!");
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskToDelete.id)
      );

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        tasks: tasks.filter((task) => task.id !== taskToDelete.id),
      });
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
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
              <Button onClick={handleOpenCreateTask}>
                Create a Task
            </Button>
          </div>
          <CreateTask
                onNewTask={handleNewTask}
                onUpdateTask={handleUpdateTask}
                userClasses={userClasses}
                task={editingTask}
                mode={drawerMode}
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
              />
           <DataTable 
              data={tasks} 
              columns={columns} 
              userClasses={userClasses} 
              onDelete={handleDeleteTask}  
              onEdit={handleEditTask}  
              onStatusChange={handleStatusChange} />
        </div>
      </div>
    </>
  );
}

export default TaskPage;
