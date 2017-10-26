import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import morgan from 'morgan';
import apiRoutes from './routes/api.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

app.use('/api/v1', apiRoutes);

app.listen(port);

console.log('Server start at http://localhost:' + port);
