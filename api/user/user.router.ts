import { authMiddleware, validate } from '@middlewares';
import { Router } from 'express';
import {
    deleteAccount,
    getAuditLogs,
    getMe,
    updateSettings,
} from './user.controller';
import {
    deleteAccountSchema,
    paginationSchema,
    settingsSchema,
} from './user.schema';

const userRouter = Router();

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
