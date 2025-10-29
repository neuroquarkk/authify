import { authRouter, healthRouter, userRouter } from '@api';
import { config } from '@config';
import { errorHandler } from '@middlewares';
import cookieParser from 'cookie-parser';
import express from 'express';
import morgan from 'morgan';

const app = express();

app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));
app.use(morgan(config.MorganFormat));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/health', healthRouter);

app.use(errorHandler);
export default app;
