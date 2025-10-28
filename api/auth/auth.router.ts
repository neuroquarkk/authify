import { validate } from '@middlewares';
import { Router } from 'express';
import {
    authSchema,
    loginTfaSchema,
    logoutSchema,
    tokenQuerySchema,
} from './auth.schema';
import {
    login,
    loginVerifyTfa,
    logout,
    refresh,
    signup,
    verifyEmail,
} from './auth.controller';
import { authMiddleware } from '@middlewares';
import { AuthService } from './auth.service';

await AuthService.init();

const authRouter = Router();

authRouter.route('/signup').post(validate(authSchema, 'body'), signup);
authRouter.route('/login').post(validate(authSchema, 'body'), login);
authRouter.route('/refresh').post(refresh);
authRouter
    .route('/login/verify-2fa')
    .post(validate(loginTfaSchema, 'body'), loginVerifyTfa);
authRouter
    .route('/verify-email')
    .post(validate(tokenQuerySchema, 'query'), verifyEmail);

authRouter
    .route('/logout')
    .post(authMiddleware, validate(logoutSchema, 'body'), logout);

export { authRouter };
