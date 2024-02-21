// import { useState, useEffect } from 'react';
// import OpenAI from 'openai';

// const apiKey = "ada";
// //import.meta.env.VITE_OPEN_AI_KEY;
// const assistantId = "aa";
// //import.meta.env.VITE_ASSISTANT_ID;

// const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

// export async function fetchAssistant() {
//   if (!assistantId) {
//     throw new Error('ASSISTANT_ID environment variable is not set');
//   }
//   try {
//     const assistant = await openai.beta.assistants.retrieve(assistantId);
//     return assistant;
//   } catch (error) {
//     console.error('Error fetching assistant:', error);
//     throw error; // rethrow the error for handling in the React component
//   }
// }

// function OpenAITest() {

//   const [assistant, setAssistant] = useState(null);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchAssistant()
//       .then((assistantData: any) => {
//         setAssistant(assistantData);
//       })
//       .catch((err: any) => {
//         setError(err.message);
//       });
//   }, []);

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   return (
//     <div>Assistant Info: {JSON.stringify(assistant)}</div>
//   );
// }

// export default OpenAITest;
