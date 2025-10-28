import { prisma } from '@db';
import { faker } from '@faker-js/faker';

function hash(password: string): Promise<string> {
    return Bun.password.hash(password, { algorithm: 'argon2id' });
}

async function main() {
    if (process.env.NODE_ENV === 'production') {
        console.error('check your NODE_ENV variable');
        process.exit(1);
    }

    console.log('Start seeding...');

    console.log('Cleaning database...');
    await prisma.audit.deleteMany();
    await prisma.session.deleteMany();
    await prisma.twoFactorToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();

    // Admin account
    const admin = await prisma.user.create({
        data: {
            email: 'admin@example.com',
            password: await hash('Admin@123'),
            isVerified: true,
            isTwoFactorEnabled: false,
        },
    });

    console.log(`Created admin user: ${admin.email}`);

    await prisma.$transaction([
        prisma.session.create({
            data: {
                userId: admin.id,
                token: faker.string.alphanumeric(64),
                ip: faker.internet.ip(),
                userAgent: faker.internet.userAgent(),
            },
        }),
        prisma.audit.create({
            data: {
                userId: admin.id,
                action: 'login',
            },
        }),
    ]);

    console.log(`... created 1 session and 1 audit log for admin`);

    // 2FA enabled user
    const tfaUser = await prisma.user.create({
        data: {
            email: 'tfa-user@example.com',
            password: await hash('TfaUser@123'),
            isVerified: true,
            isTwoFactorEnabled: true,
        },
    });
    console.log(`Created 2FA user: ${tfaUser.email}`);

    // Unverifed user
    const unverifedUser = await prisma.user.create({
        data: {
            email: 'unverifed@example.com',
            password: await hash('Unverifed@example.com'),
            isVerified: false,
        },
    });
    await prisma.verificationToken.create({
        data: {
            userId: unverifedUser.id,
            token: faker.string.hexadecimal({ length: 64 }),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
    });

    console.log(`Created unverified user: ${unverifedUser.email}`);
    console.log(`... and created 1 verifcation token for them`);

    // Create 20 random verified users
    console.log(`Creating 20 random users...`);
    const randomPass = await hash('Password@123');
    const userPromises = [];

    for (let i = 0; i < 20; i++) {
        const userPromise = prisma.user.create({
            data: {
                email: faker.internet.email({
                    firstName: faker.person.firstName(),
                    lastName: faker.person.lastName(),
                }),
                password: randomPass,
                isVerified: faker.datatype.boolean(0.5),
                isTwoFactorEnabled: faker.datatype.boolean(0.25),
            },
        });

        userPromises.push(userPromise);
    }

    await Promise.all(userPromises);
    console.log(`... created 20 random users`);

    console.log(`Seeding finished`);
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
