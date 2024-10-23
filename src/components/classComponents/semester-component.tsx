import React, { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { format } from "date-fns";
import { auth, db } from '../../firebase-config';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import ClassComponent from "./class-component"
import { classSchema} from "../../data/classesSchema";
import { z } from "zod"
import { useRouter } from "next/navigation";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../ui/accordion"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { onAuthStateChanged } from "firebase/auth";
interface SemesterComponentProps {
    index: number;
    name: string;
    startDate: Date;
    endDate: Date;
}



const SemesterComponent: React.FC<SemesterComponentProps> = ({ index, name, startDate, endDate }) => {
    type Class = z.infer<typeof classSchema>;
    const [className, setClassName] = useState("");
    const [classes, setClasses] = useState<Class[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();


    useEffect(() => {
        console.log("REACHED!");
        setLoading(true);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              console.log("REACHED 2!");
              const userDocRef = doc(db, "users", user.uid);
              const userDocSnap = await getDoc(userDocRef);
              console.log("USER DOC SNAP",userDocSnap);
              console.log("USER DOC REF",userDocRef);


              console.log("REACHED 3!");

      
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                console.log("REACHED 4!");

      
                // Log the raw user data to check if "classes" exists
                console.log("Raw user data:", userData);
      
                const validatedClasses = z
                  .array(classSchema)
                  .parse(userData.classes || []);
      
                // Log the validated classes
                console.log("Validated Classes:", validatedClasses);
      
                const filteredClasses = validatedClasses.filter((cls) => cls.semesterName === name);
      
                // Log the filtered classes to ensure filtering works
                console.log(`Filtered Classes for semester "${name}":`, filteredClasses);
      
                setClasses(filteredClasses);
              } else {
                console.error("No user document found!");
              }
            } catch (error) {
                setError(error instanceof Error ? error : new Error("Unknown error occurred"));
                console.error("Caught error during data fetching:", error);
                console.error("Failed to fetch classes:", error.message);
                console.error(error.stack);
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

      // Handle no classes case
      if (!loading && !error && classes.length === 0) {
        return <div>No classes found for this semester</div>;
      }
      
      if (error) {
        console.error("Rendering error:", error);
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

        const isClassExist = classes.some(classInterface => classInterface.name === className);
        if (isClassExist) {
            alert("A class with the same name already exists in this semester.");
            return;
        }

        const newClass = {
            semesterName: name,
            name: className

        };

        try{
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                classes: arrayUnion(newClass),
            });

            setClasses([...classes, newClass]);
            setClassName("");
            setIsDrawerOpen(false);
        } catch (error) {
            // Handle the error
            console.error("Error adding semester: ", error);
          }
    };

    return (

        <AccordionItem className="mb-5" value={`item-${index}`}>
            <div className="bg-[#FFFFFF] rounded-md shadow-lg p-6 overflow-x-auto">
                <AccordionTrigger className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold mb-1">{name}</h1>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="flex justify-between items-center">
                        <p className="text-lg text-[#0C4D53] mb-2">{`${format(startDate, 'MMM do yyyy')} - ${format(endDate, 'MMM do yyyy')}`}</p>

                        <Drawer open={isDrawerOpen}>
                            <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)}>
                                <Button data-testid="add-class-button" className="bg-[#1FCAD9] text-[#FFFFFF]">+ Add Class</Button>
                            </DrawerTrigger>
                            <DrawerContent>
                                <DrawerHeader>
                                    <DrawerTitle>Create a new class</DrawerTitle>
                                    <DrawerDescription>Enter all of the details of your class.</DrawerDescription>

                                    <Label>Name of Class:</Label>
                                    <Input id="className" placeholder="Enter Class Name" value={className} onChange={handleClassNameChange} required />

                                </DrawerHeader>
                                <DrawerFooter className="pt-2">
                                    <Button onClick={handleSubmit}>Submit</Button>
                                    <DrawerClose asChild>
                                        <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
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
                                />
                            ))}
                        </Accordion>
                    </div>
                </AccordionContent>
            </div>
        </AccordionItem>
    );
}

export default SemesterComponent;
