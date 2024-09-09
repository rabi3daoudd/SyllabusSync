"use client";
import axios from 'axios';
import {auth} from "../firebase-config";

export const findOrCreateSyallbusSyncCalendar = async () => {

    try{

        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            console.error('No Firebase user logged in');
            return;
        }

        const queryParams = new URLSearchParams({ uid: firebaseUser.uid });

        const listOfCalendars = await axios.get(`api/list-user-calendars?${queryParams}`)
        const existingCalendar = listOfCalendars.data.items.find((calendar: { summary: string; }) => calendar.summary === "SyllabusSync");
        console.log("Are we here?");
        if(existingCalendar){
            return existingCalendar.id;
        }
        else{
            const summary = "SyllabusSync";
            const description = "Description of SyllabusSync"
            const timeZone = "America/New_York";

            const response = await axios.post('/api/create-calendar', {summary, description,timeZone, uid: firebaseUser.uid })

            const stringifiedResponse = JSON.stringify(response.data)
            const responseObj = JSON.parse(stringifiedResponse);
            const calendarId = responseObj.data.id;
            return calendarId;
            
        }
    }
    catch(error){
        if (axios.isAxiosError(error)) {
            // Now TypeScript knows `error` is an AxiosError, you can access `error.response`
            const message = error.response?.data?.message || error.message;
            console.error("Error finding or creating calendar: ", message);
            throw new Error(message); // Rethrow a new Error with the obtained message
        } else if (error instanceof Error) {
            // This checks if error is a generic JavaScript Error (useful for non-Axios related errors)
            console.error("Error finding or creating calendar: ", error.message);
            throw error; // Rethrow the original error
        } else {
            // If it's not an AxiosError or a standard Error, handle it as a generic unknown error.
            console.error("An unknown error occurred");
            throw new Error("An unknown error occurred");
        }
    }

};