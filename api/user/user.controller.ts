import { prisma } from '@db';
import { ApiError, ApiResponse, asyncHandler } from '@utils';
import { USER_SELECT } from './user.config';
import type {
    ForgotPassword,
    ResetPassword,
    DeleteAccount,
    PaginationQuery,
    Settings,
} from './user.schema';
import { UserService } from './user.service';

export const getMe = asyncHandler(async (req, res) => {
    const id = req.user.id;

    const user = await prisma.user.findUnique({
        where: { id },
        select: USER_SELECT,
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'User profile fetched'));
});

export const updateSettings = asyncHandler<Settings>(async (req, res) => {
    const id = req.user.id;
    const settingsData = req.body;

    const [user] = await prisma.$transaction([
        prisma.user.update({
            where: { id },
            data: settingsData,
            select: USER_SELECT,
        }),
        prisma.audit.create({
            data: {
                userId: id,
                action: 'user_settings_update',
            },
        }),
    ]);

    return res.status(200).json(new ApiResponse(200, user, 'Settings updated'));
});

export const deleteAccount = asyncHandler<DeleteAccount>(async (req, res) => {
    const id = req.user.id;
    const { password } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const isPasswordCorrect = await Bun.password.verify(
        password,
        user.password
    );
    if (!isPasswordCorrect) {
        throw new ApiError(401, 'Invalid password');
    }

    await prisma.user.delete({ where: { id } });

    return res
        .status(200)
        .clearCookie('accessToken')
        .clearCookie('accessToken')
        .json(new ApiResponse(200, null, 'Account deleted successfully'));
});

export const getAuditLogs = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = req.validatedQuery as PaginationQuery;
    const skip = (page - 1) * limit;

    const [logs, total] = await prisma.$transaction([
        prisma.audit.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            skip,
            take: limit,
        }),
        prisma.audit.count({
            where: { userId },
        }),
    ]);

    const pageCount = Math.ceil(total / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                logs,
                pagination: {
                    total,
                    pageCount,
                    currentPage: page,
                    limit,
                },
            },
            'Audit logs fetched'
        )
    );
});

export const forgotPassword = asyncHandler<ForgotPassword>(async (req, res) => {
    const { email } = req.body;
    await UserService.sendReset(email);

    return res
        .status(200)
        .json(new ApiResponse(200, null, 'Password reset email has been sent'));
});

export const resetPassword = asyncHandler<ResetPassword>(async (req, res) => {
    const { token, password } = req.body;
    await UserService.resetPassword(token, password);

    return res
        .status(200)
        .json(new ApiResponse(200, null, 'Password reset successful'));
});
