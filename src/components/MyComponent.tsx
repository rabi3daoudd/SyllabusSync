import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyComponent = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/helloWorld')
      .then(response => {
        setMessage(response.data);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }, []);

  return (
    <div>
      <p>Message from server: {message}</p>
    </div>
  );
};

export default MyComponent;
