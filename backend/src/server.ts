import cors from 'cors';
import express from 'express';
import apiRouter from './routes/api.routes';
import morgan from 'morgan';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

const port = 3001;

app.use(cors());

app.get('/helloWorld', (req, res) => {
  res.send('Hello World!');
});

app.use('/api', apiRouter);

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

// Export the app for testing purposes
export { app };
