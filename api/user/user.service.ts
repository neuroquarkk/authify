import { config } from '@config';
import { join } from 'path';
import nodemailer from 'nodemailer';
import { readFile } from 'fs/promises';
import { ApiError } from '@utils';
import { prisma } from '@db';
import { randomBytes } from 'crypto';

export class UserService {
    private static readonly tokenValidity =
        config.TOKEN_EXPIRY * 60 * 60 * 1000;

    private static resetPasswordTemplate: string;
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
            const resetPassPath = join(
                process.cwd(),
                'src',
                'templates',
                'reset-password.html'
            );
            this.resetPasswordTemplate = await readFile(resetPassPath, 'utf-8');
        } catch (error) {
            console.error('Faild to load user email templates:', error);
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
                    from: `"authify" <${config.EMAIL_USER}>`,
                    to,
                    subject,
                    html,
                },
                (_err, info) => {
                    console.log(
                        'Preview URL:',
                        nodemailer.getTestMessageUrl(info)
                    );
                }
            );
        } catch (error) {
            console.error('Error sending email:', error);
            throw new ApiError(500, 'Failed to send email');
        }
    }

    public static async sendReset(email: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return;

        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + this.tokenValidity);

        await prisma.$transaction([
            prisma.passwordResetToken.upsert({
                where: { userId: user.id },
                create: { userId: user.id, token, expiresAt },
                update: { token, expiresAt },
            }),
            prisma.audit.create({
                data: {
                    userId: user.id,
                    action: 'password_reset_request',
                },
            }),
        ]);

        const resetLink = `${config.CLIENT_URL}/reset-password?token=${token}`;
        const content = this.resetPasswordTemplate
            .replaceAll('{{RESET_LINK}}', resetLink)
            .replace('{{EXPIRY}}', config.TOKEN_EXPIRY.toString());

        await this.sendEmail(user.email, 'Reset Your Password', content);
    }

    public static async resetPassword(
        token: string,
        newPassword: string
    ): Promise<void> {
        const dbToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!dbToken || new Date() > dbToken.expiresAt) {
            if (dbToken) {
                await prisma.passwordResetToken.delete({
                    where: { id: dbToken.id },
                });
            }
            throw new ApiError(400, 'Invalid or expired password reset token');
        }

        const hashedPassword = await Bun.password.hash(newPassword, {
            algorithm: 'argon2id',
        });

        await prisma.$transaction([
            prisma.user.update({
                where: { id: dbToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.session.updateMany({
                where: {
                    userId: dbToken.id,
                    revoked: false,
                },
                data: { revoked: true },
            }),
            prisma.passwordResetToken.delete({ where: { id: dbToken.id } }),
            prisma.audit.create({
                data: {
                    userId: dbToken.userId,
                    action: 'password_reset_success',
                },
            }),
            prisma.audit.create({
                data: {
                    userId: dbToken.userId,
                    action: 'all_sessions_revoked_post_reset',
                },
            }),
        ]);
    }
}
