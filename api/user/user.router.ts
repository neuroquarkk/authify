import { authMiddleware, validate } from '@middlewares';
import { Router } from 'express';
import {
    deleteAccount,
    forgotPassword,
    getAuditLogs,
    getMe,
    resetPassword,
    updateSettings,
} from './user.controller';
import {
    deleteAccountSchema,
    forgotPasswordSchema,
    paginationSchema,
    resetPasswordSchema,
    settingsSchema,
} from './user.schema';
import { UserService } from './user.service';

await UserService.init();

const userRouter = Router();

// Public Routes
userRouter
    .route('/password/forgot')
    .post(validate(forgotPasswordSchema, 'body'), forgotPassword);
userRouter
    .route('/password/reset')
    .post(validate(resetPasswordSchema, 'body'), resetPassword);

// Private Routes
userRouter.use(authMiddleware);

userRouter.route('/me').get(authMiddleware, getMe);

userRouter
    .route('/settings')
    .post(validate(settingsSchema, 'body'), updateSettings);

userRouter
    .route('/delete')
    .delete(validate(deleteAccountSchema, 'body'), deleteAccount);

userRouter
    .route('/audit')
    .get(validate(paginationSchema, 'query'), getAuditLogs);

export { userRouter };
