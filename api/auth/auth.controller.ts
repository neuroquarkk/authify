import { ApiError, ApiResponse, asyncHandler, JWT } from '@utils';
import type { Logout, Auth, LoginTfa, TokenQuery } from './auth.schema';
import { prisma } from '@db';
import {
    COOKIE_OPTIONS,
    REFRESH_COOKIE_OPTIONS,
    USER_SELECT,
} from './auth.config';
import { AuthService } from './auth.service';

export const signup = asyncHandler<Auth>(async (req, res) => {
    const data = req.body;

    const userExists = await prisma.user.findFirst({
        where: {
            email: data.email,
        },
    });

    if (userExists) {
        throw new ApiError(409, 'Email already taken');
    }

    data.password = await Bun.password.hash(data.password, {
        algorithm: 'argon2id',
    });

    const user = await prisma.user.create({
        data,
        select: {
            ...USER_SELECT,
        },
    });

    await AuthService.sendVerification(user.id, user.email);

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                user,
                'User created successfully, check email to verify account'
            )
        );
});

export const login = asyncHandler<Auth>(async (req, res) => {
    const data = req.body;

    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });
    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordCorrect = await Bun.password.verify(
        data.password,
        user.password
    );
    if (!isPasswordCorrect) {
        throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isVerified) {
        throw new ApiError(403, 'Verify your email address before loggin');
    }

    if (user.isTwoFactorEnabled) {
        await AuthService.sendTF(user.id, user.email);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { tfaRequried: true, email: user.email },
                    '2FA code sent to your email'
                )
            );
    }

    const { accessToken, refreshToken, safeUser } =
        await AuthService.createSession(
            user,
            req.ip,
            req.headers['user-agent']
        );

    return res
        .status(200)
        .cookie('accessToken', accessToken, COOKIE_OPTIONS)
        .cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS)
        .json(
            new ApiResponse(
                200,
                { user: safeUser, accessToken },
                'Login successful'
            )
        );
});

export const refresh = asyncHandler(async (req, res) => {
    const token =
        req.cookies?.refreshToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new ApiError(401, 'Refresh token not found');
    }

    const payload = JWT.verify(token);

    const session = await prisma.session.findFirst({
        where: {
            userId: payload.userId,
            token,
            revoked: false,
        },
        include: {
            user: true,
        },
    });

    if (!session || !session.user) {
        throw new ApiError(401, 'Invalid session');
    }

    const accessToken = JWT.generate({ userId: session.userId }, 'access');
    const refreshToken = JWT.generate({ userId: session.userId }, 'refresh');

    await prisma.$transaction([
        prisma.session.update({
            where: {
                id: session.id,
            },
            data: {
                token: refreshToken,
                rotationCounter: { increment: 1 },
            },
        }),
        prisma.audit.create({
            data: {
                userId: session.userId,
                action: 'refresh_token',
            },
        }),
    ]);

    return res
        .status(200)
        .cookie('accessToken', accessToken, COOKIE_OPTIONS)
        .cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS)
        .json(
            new ApiResponse(
                200,
                { accessToken },
                'Tokens refreshed successfully'
            )
        );
});

export const logout = asyncHandler<Logout>(async (req, res) => {
    const token =
        req.cookies?.refreshToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new ApiError(401, 'Refresh token not found');
    }

    const userId = req.user?.id!;
    const allDevices = req.body.allDevices;

    if (allDevices === true) {
        await prisma.$transaction([
            prisma.session.updateMany({
                where: {
                    userId,
                    revoked: false,
                },
                data: {
                    revoked: true,
                },
            }),

            prisma.audit.create({
                data: {
                    userId,
                    action: 'logout_all_devices',
                },
            }),
        ]);
    } else {
        await prisma.$transaction([
            prisma.session.updateMany({
                where: {
                    token,
                    userId,
                    revoked: false,
                },
                data: {
                    revoked: true,
                },
            }),

            prisma.audit.create({
                data: {
                    userId,
                    action: 'logout_single_device',
                },
            }),
        ]);
    }

    return res
        .clearCookie('accessToken')
        .clearCookie('refreshToken')
        .json(new ApiResponse(200, null, 'logout successfull'));
});

export const loginVerifyTfa = asyncHandler<LoginTfa>(async (req, res) => {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isValid = await AuthService.verifyTF(user.id, otp);
    if (!isValid) {
        throw new ApiError(401, 'Invalid or expired 2FA code');
    }

    const { accessToken, refreshToken, safeUser } =
        await AuthService.createSession(
            user,
            req.ip,
            req.headers['user-agent']
        );

    return res
        .status(200)
        .cookie('accessToken', accessToken, COOKIE_OPTIONS)
        .cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS)
        .json(
            new ApiResponse(
                200,
                { user: safeUser, accessToken },
                'Login successful'
            )
        );
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query as TokenQuery;

    const userEmail = await AuthService.verifyAccount(token);
    if (!userEmail) {
        throw new ApiError(400, 'Invalid or expired verification link');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, 'Email verified successfully'));
});
