import { config } from '@config';
import { prisma } from '@db';
import { randomBytes, randomInt } from 'crypto';
import * as nodemailer from 'nodemailer';
import { ApiError, JWT } from '@utils';
import { join } from 'path';
import { readFile } from 'fs/promises';
import type { User } from 'prisma/generated/client';

interface CreateSession {
    safeUser: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}

export class AuthService {
    private static readonly tokenValidity = config.OTP_EXPIRY * 60 * 1000;
    private static readonly verificationTokenValidity =
        config.VERIFICATION_EXPIRY * 60 * 60 * 1000;

    private static tfaTemplate: string;
    private static verificationTemplate: string;

    private static transporter: nodemailer.Transporter =
        nodemailer.createTransport({
            host: config.EMAIL_HOST,
            port: config.EMAIL_PORT,
            secure: config.EMAIL_SECURE,
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS,
            },
        });

    public static async init(): Promise<void> {
        try {
            const tfaPath = join(process.cwd(), 'src', 'templates', '2fa.html');
            const verficationPath = join(
                process.cwd(),
                'src',
                'templates',
                'verify-email.html'
            );

            const [tfaFile, verifyFile] = await Promise.all([
                readFile(tfaPath, 'utf-8'),
                readFile(verficationPath, 'utf-8'),
            ]);

            this.tfaTemplate = tfaFile;
            this.verificationTemplate = verifyFile;
        } catch (error) {
            process.exit(1);
        }
    }

    private static async sendEmail(
        to: string,
        subject: string,
        html: string
    ): Promise<void> {
        try {
            this.transporter.sendMail(
                {
                    from: `"authify" <${config.EMAIL_USER}`,
                    to,
                    subject,
                    html,
                },
                (_err, info) => {
                    console.log(
                        'Preview URL: %s',
                        nodemailer.getTestMessageUrl(info)
                    );
                }
            );
        } catch (error) {
            console.error('Error sending email:', error);
            throw new ApiError(500, 'Failed to send email');
        }
    }

    public static async sendTF(
        userId: string,
        userEmail: string
    ): Promise<void> {
        const otp = randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + this.tokenValidity);
        const token = await Bun.password.hash(otp, {
            algorithm: 'bcrypt',
        });

        await prisma.$transaction([
            prisma.twoFactorToken.upsert({
                where: { userId },
                create: {
                    userId,
                    token,
                    expiresAt,
                },
                update: {
                    token,
                    expiresAt,
                },
            }),

            prisma.audit.create({
                data: {
                    userId,
                    action: 'tfa_code_send',
                },
            }),
        ]);

        const content = this.tfaTemplate.replace('{{OTP}}', otp);
        await this.sendEmail(userEmail, 'Your 2FA Verfication Code', content);
    }

    public static async verifyTF(
        userId: string,
        otp: string
    ): Promise<boolean> {
        const token = await prisma.twoFactorToken.findUnique({
            where: { userId },
        });

        if (!token) return false;

        if (new Date() > token.expiresAt) {
            prisma.twoFactorToken.delete({ where: { id: token.id } });
            return false;
        }

        const isValid = await Bun.password.verify(otp, token.token);
        if (!isValid) return false;

        await prisma.$transaction([
            prisma.twoFactorToken.delete({ where: { id: token.id } }),
            prisma.audit.create({
                data: {
                    userId,
                    action: 'tfa_verify_success',
                },
            }),
        ]);
        return true;
    }

    public static async sendVerification(
        userId: string,
        userEmail: string
    ): Promise<void> {
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + this.verificationTokenValidity);

        await prisma.$transaction([
            prisma.verificationToken.upsert({
                where: { userId },
                create: { userId, token, expiresAt },
                update: { token, expiresAt },
            }),
            prisma.audit.create({
                data: {
                    userId,
                    action: 'verification_email_sent',
                },
            }),
        ]);

        const verificationLink = `${config.CLIENT_URL}/verify-email?token=${token}`;
        const content = this.verificationTemplate.replace(
            '{{VERIFICATION_LINK}}',
            verificationLink
        );

        await this.sendEmail(userEmail, 'Verify Your Email Address', content);
    }

    public static async verifyAccount(token: string): Promise<string | null> {
        const dbToken = await prisma.verificationToken.findUnique({
            where: { token },
        });
        if (!dbToken) return null;

        if (new Date() > dbToken.expiresAt) {
            await prisma.verificationToken.delete({
                where: { id: dbToken.id },
            });
            return null;
        }

        const [user] = await prisma.$transaction([
            prisma.user.update({
                where: { id: dbToken.userId },
                data: { isVerified: true },
                select: { email: true },
            }),
            prisma.verificationToken.delete({ where: { id: dbToken.id } }),
            prisma.audit.create({
                data: {
                    userId: dbToken.userId,
                    action: 'account_verified_success',
                },
            }),
        ]);

        return user.email;
    }

    public static async createSession(
        user: User,
        ip?: string,
        userAgent?: string
    ): Promise<CreateSession> {
        const accessToken = JWT.generate({ userId: user.id }, 'access');
        const refreshToken = JWT.generate({ userId: user.id }, 'refresh');

        await prisma.$transaction([
            prisma.session.create({
                data: {
                    userId: user.id,
                    token: refreshToken,
                    ip,
                    userAgent,
                },
            }),
            prisma.audit.create({
                data: {
                    userId: user.id,
                    action: 'login',
                },
            }),
        ]);

        const { password, ...safeUser } = user;

        return { accessToken, refreshToken, safeUser };
    }
}
