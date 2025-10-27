import { PrismaClient } from 'prisma/generated/client';

export const prisma = new PrismaClient();

export async function checkConn() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('Database connection successful');
    } catch (error) {
        console.error(error);
        throw new Error('Database connection failed');
    }
}
