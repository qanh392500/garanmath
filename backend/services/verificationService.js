import nodemailer from 'nodemailer';

export const verificationService = async (email, subject, htmlBody) => {
    const host = 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
    const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL;

    if (!smtpUser || !process.env.SMTP_PASSWORD) {
        throw new Error("SMTP configuration is missing in environment variables");
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: smtpUser,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    return transporter.sendMail({
        from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: subject,
        html: htmlBody,
    });
};