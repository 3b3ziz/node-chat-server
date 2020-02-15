import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { router as indexRouter } from './routes/index';
import { router as chatsRouter } from './routes/chats';
import { router as usersRouter } from './routes/users';

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/chats', chatsRouter);
app.use('/users', usersRouter);

export { app };
