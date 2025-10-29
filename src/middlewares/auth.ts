import { prisma } from '@db';
import { ApiError, asyncHandler, JWT } from '@utils';

export const authMiddleware = asyncHandler(async (req, _res, next) => {
    const token =
        req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new ApiError(401, 'No token provided');
    }

    const payload = JWT.verify(token);

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new ApiError(401, 'Invalid token');
    }

    req.user = user;
    next();
});
