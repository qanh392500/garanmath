import { verificationService } from "../services/verificationService.js";
import { 
    VERIFICATION_EMAIL_TEMPLATE, 
    PASSWORD_RESET_REQUEST_TEMPLATE, 
    PASSWORD_RESET_SUCCESS_TEMPLATE 
} from "./emailTemplates.js";

export const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const html = VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken);
        await verificationService(email, "Verify Your Email", html);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

export const sendWelcomeEmail = async (email, name) => {
    try {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Welcome to GaranMath!</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <p>Hello ${name},</p>
                    <p>Welcome to GaranMath! We're excited to have you on board.</p>
                    <p>Your email has been successfully verified and your account is now active.</p>
                    <p>Best regards,<br>GaranMath Team</p>
                </div>
            </body>
            </html>
        `;
        await verificationService(email, "Welcome to GaranMath", html);
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw new Error(`Error sending welcome email: ${error}`);
    }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        const html = PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL);
        await verificationService(email, "Reset Your Password", html);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
};

export const sendResetSuccessEmail = async (email) => {
    try {
        await verificationService(email, "Password Reset Successful", PASSWORD_RESET_SUCCESS_TEMPLATE);
    } catch (error) {
        console.error("Error sending password reset success email:", error);
        throw new Error(`Error sending password reset success email: ${error}`);
    }
};
