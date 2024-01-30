import cors from 'cors';
import express from 'express';

const app = express();
const port = 3001;

app.use(cors());

app.get('/helloWorld', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
