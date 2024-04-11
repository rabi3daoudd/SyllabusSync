// Import React for component creation and hooks
import * as React from "react";

// Define a custom hook called useMediaQuery
// This hook accepts a media query string and returns a boolean value indicating whether the query matches the current state of the document
export function useMediaQuery(query: string) {
  // Initialize a state variable 'value' with initial value as false
  // 'value' will hold the result of the media query
  const [value, setValue] = React.useState(false);

  // Use the useEffect hook to add an event listener to the media query list
  // This effect will run whenever the 'query' prop changes
  React.useEffect(() => {
    // Define a function to update 'value' based on the media query match status
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    // Use the matchMedia function to evaluate the media query
    const result = matchMedia(query);
    // Add an event listener that will call 'onChange' whenever the media query match status changes
    result.addEventListener("change", onChange);
    // Set the initial value of 'value' based on the current match status of the media query
    setValue(result.matches);

    // Return a cleanup function that will remove the event listener when the component unmounts or the 'query' prop changes
    return () => result.removeEventListener("change", onChange);
  }, [query]);

  // Return the current value of 'value'
  return value;
}
