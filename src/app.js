import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const app = express();
app.get('/', (req, res) => {
  res.send('Hello World!');
});


export default app;