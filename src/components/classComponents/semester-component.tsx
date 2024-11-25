import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { auth, db } from "../../firebase-config";
import { doc, updateDoc, arrayUnion, getDoc, arrayRemove } from "firebase/firestore";
import ClassComponent from "./class-component";
import { classSchema } from "../../data/classesSchema";
import { z } from "zod";
import { useRouter } from "next/navigation";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { onAuthStateChanged } from "firebase/auth";
import { PencilIcon, TrashIcon } from "lucide-react";

interface SemesterComponentProps {
  index: number;
  name: string;
  startDate: Date;
  endDate: Date;
  onEdit: () => void;
  onDelete: () => void;
}

const SemesterComponent: React.FC<SemesterComponentProps> = ({
  index,
  name,
  startDate,
  endDate,
  onEdit,
  onDelete,
}) => {
  type Class = z.infer<typeof classSchema>;
  const [className, setClassName] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const validatedClasses = z
              .array(classSchema)
              .parse(userData.classes || []);
            const filteredClasses = validatedClasses.filter(
              (cls) => cls.semesterName === name
            );
            setClasses(filteredClasses);
          } else {
            console.error("No user document found!");
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            setError(error);
          } else {
            setError(new Error("An error occurred while fetching classes"));
          }
          console.error("Failed to fetch classes:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return unsubscribe;
  }, [name]);

  if (loading) {
    return <div>Loading classes...</div>;
  }

  if (error) {
    return <div>Failed to load classes</div>;
  }

  const handleClassNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClassName(event.target.value);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in!");
      return;
    }

    if (!className) {
      alert("Please fill in all fields.");
      return;
    }

    const isClassExist = classes.some((someClass) => someClass.name === className);
    if (isClassExist) {
      alert("A class with the same name already exists in this semester.");
      return;
    }

    const newClass = {
      semesterName: name,
      name: className,
    };

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        classes: arrayUnion(newClass),
      });

      setClasses([...classes, newClass]);
      setClassName("");
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error adding class: ", error);
    }
  };

  const handleDeleteClass = async (classNameToDelete: string) => {
    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in!");
      return;
    }

    const classToDelete = classes.find((cls) => cls.name === classNameToDelete);
    if (!classToDelete) {
      console.error("Class not found!");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        classes: arrayRemove(classToDelete),
      });

      setClasses(classes.filter((cls) => cls.name !== classNameToDelete));
      console.log(`Deleted class: ${classNameToDelete}`);
    } catch (error) {
      console.error("Error deleting class: ", error);
    }
  };

  const handleEditClass = (classToEdit: Class) => {
    setEditingClass(classToEdit);
    setClassName(classToEdit.name);
    setIsDrawerOpen(true);
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in!");
      return;
    }

    const updatedClass = {
      ...editingClass,
      name: className,
    };

    if (!editingClass || !className) {
      alert("Please fill in all fields.");
      return;
    }
    const isDuplicateName = classes.some(
      (classObject) =>
        classObject.name === className && classObject.name !== editingClass.name
    );
    if (isDuplicateName) {
      alert("A class with the same name already exists in the semester. Please choose a different name.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);

      // Remove the old class
      await updateDoc(userDocRef, {
        classes: arrayRemove(editingClass),
      });

      // Add the updated class
      await updateDoc(userDocRef, {
        classes: arrayUnion(updatedClass),
      });

      setClasses(
        classes.map((cls) =>
          cls.name === editingClass.name ? updatedClass : cls
        )
      );
      setEditingClass(null);
      setClassName("");
      setIsDrawerOpen(false);
      console.log(`Updated class: ${updatedClass.name}`);
    } catch (error) {
      console.error("Error updating class: ", error);
    }
  };

  return (
    <AccordionItem className="mb-5" value={`item-${index}`}>
      <div className="rounded-md shadow-lg p-6 overflow-x-auto">
        <AccordionTrigger className="flex justify-between items-center w-full">
          <h1 className="text-4xl font-bold mb-1">{name}</h1>
          <div className="flex space-x-2 items-center ml-auto">
            <PencilIcon className="w-5 h-5 cursor-pointer" onClick={onEdit} />
            <TrashIcon className="w-5 h-5 cursor-pointer" onClick={onDelete} />
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex justify-between items-center">
            <p className="text-lg mb-2">{`${format(
              startDate,
              "MMM do yyyy"
            )} - ${format(endDate, "MMM do yyyy")}`}</p>
            <Drawer open={isDrawerOpen}>
              <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                <Button data-testid="add-class-button">+ Add Class</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>
                    {editingClass ? "Edit Class" : "Create a new class"}
                  </DrawerTitle>
                  <DrawerDescription>
                    Enter all of the details of your class.
                  </DrawerDescription>

                  <Label>Name of Class:</Label>
                  <Input
                    id="className"
                    placeholder="Enter Class Name"
                    value={className}
                    onChange={handleClassNameChange}
                    required
                  />
                </DrawerHeader>
                <DrawerFooter className="pt-2">
                  <Button onClick={editingClass ? handleUpdateClass : handleSubmit}>
                    {editingClass ? "Update" : "Submit"}
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setEditingClass(null);
                        setClassName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {classes.map((classObject, classIndex) => (
                <ClassComponent
                  key={classIndex}
                  semesterName={classObject.semesterName}
                  index={classIndex + 1}
                  name={classObject.name}
                  onEdit={() => handleEditClass(classObject)}
                  onDelete={() => handleDeleteClass(classObject.name)}
                />
              ))}
            </Accordion>
          </div>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
};

export default SemesterComponent;
