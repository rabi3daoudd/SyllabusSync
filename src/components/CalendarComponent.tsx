// import { useState, useEffect } from 'react';
// import { gapi } from 'gapi-script';
//
// const CLIENT_ID = 'YOUR_CLIENT_ID';
// const API_KEY = 'YOUR_API_KEY';
// const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
// const SCOPES = "https://www.googleapis.com/auth/calendar.events.readonly";
//
// // Define a type for your event objects
// type CalendarEvent = {
//     id: string;
//     summary: string;
//     start: {
//         dateTime: string;
//     };
// };
//
// const CalendarComponent = () => {
//     const [events, setEvents] = useState<CalendarEvent[]>([]); // Use the type for your state
//
//     useEffect(() => {
//         // Load the gapi script and initialize the API client
//         gapi.load('client:auth2', () => {
//             gapi.client.init({
//                 apiKey: API_KEY,
//                 clientId: CLIENT_ID,
//                 discoveryDocs: DISCOVERY_DOCS,
//                 scope: SCOPES
//             }).then(() => {
//                 // Check if the user is already signed in
//                 if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
//                     listUpcomingEvents();
//                 } else {
//                     gapi.auth2.getAuthInstance().signIn().then(listUpcomingEvents);
//                 }
//             });
//         });
//     }, []);
//
//     const listUpcomingEvents = () => {
//         gapi.client.calendar.events.list({
//             'calendarId': 'primary',
//             'timeMin': (new Date()).toISOString(),
//             'showDeleted': false,
//             'singleEvents': true,
//             'maxResults': 10,
//             'orderBy': 'startTime'
//         }).then((response: gapi.client.Response<gapi.client.calendar.Events>) => { // Specify the type of the response
//             const events = response.result.items as CalendarEvent[]; // Cast the items to CalendarEvent[]
//             setEvents(events);
//         });
//     };
//
//     return (
//         <div>
//             <h1>Upcoming Events</h1>
//             <ul>
//                 {events.map(event => (
//                     <li key={event.id}>{event.summary} ({new Date(event.start.dateTime).toLocaleString()})</li>
//                 ))}
//             </ul>
//         </div>
//     );
// }
//
// export default CalendarComponent;
