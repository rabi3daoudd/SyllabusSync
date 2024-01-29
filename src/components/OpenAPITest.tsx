import { useEffect } from 'react';

function OpenAPITest() {
  useEffect(() => {
    const fetchData = async () => {
      const endpoint = 'http://localhost:3001/fetch-assistant';
      console.log(`Fetching data from ${endpoint}`);

      try {
        const response = await fetch(endpoint);

        if (!response.ok) {
          console.error(`HTTP Error: ${response.status} at ${endpoint}`);
          return;
        }

        try {
          const data = await response.json();
          console.log('Data received:', data);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    };

    fetchData();
  }, []);

  return(
    <div>Test Page</div>
  )

}

export default OpenAPITest;
