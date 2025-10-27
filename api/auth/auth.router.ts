import { validate } from '@middlewares';
import { Router } from 'express';
import { authSchema, logoutSchema } from './auth.schema';
import { login, logout, refresh, signup } from './auth.controller';
import { authMiddleware } from '@middlewares';

const authRouter = Router();

authRouter.route('/signup').post(validate(authSchema, 'body'), signup);
authRouter.route('/login').post(validate(authSchema, 'body'), login);
authRouter.route('/refresh').post(refresh);

authRouter
    .route('/logout')
    .post(authMiddleware, validate(logoutSchema, 'body'), logout);

export { authRouter };
