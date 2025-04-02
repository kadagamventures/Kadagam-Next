const { SendEmailCommand } = require("@aws-sdk/client-ses");
require("dotenv").config();
const { ses } = require("../config/awsConfig"); // ✅ Use SES client from config

class EmailService {
    /**
     * ✅ Send a generic email
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} text - Plain text version of the email (can be empty string if using HTML only)
     * @param {string} html - HTML version of the email (optional if you only want plain text)
     */
    async sendEmail(to, subject, text, html = null) {
        if (!to || !subject || (!text && !html)) {
            throw new Error("❌ Missing parameters for sending email.");
        }

        if (!process.env.COMPANY_EMAIL || !process.env.COMPANY_EMAIL.includes("@")) {
            console.warn("⚠️ Warning: Invalid COMPANY_EMAIL format in .env file.");
            return;
        }

        const params = {
            Source: process.env.COMPANY_EMAIL,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject },
                Body: html
                    ? { Html: { Data: html } }
                    : { Text: { Data: text } },
            },
        };

        try {
            const command = new SendEmailCommand(params);
            const response = await ses.send(command);
            console.log(`✅ Email sent to ${to} (MessageId: ${response.MessageId})`);
        } catch (error) {
            console.error(`❌ Email to ${to} failed: ${error.message}\nStack: ${error.stack}`);
            throw new Error("Failed to send email via AWS SES");
        }
    }

    /**
     * ✅ Send Welcome Email
     */
    async sendWelcomeEmail(to, name) {
        const subject = "Welcome to TaskFlow Pro!";
        const text = `Hello ${name},\n\nWelcome to TaskFlow Pro! We are excited to have you on board.\n\nBest regards,\nTaskFlow Pro Team`;
        const html = `
            <p>Hello <strong>${name}</strong>,</p>
            <p>Welcome to <strong>TaskFlow Pro</strong>! We are excited to have you on board.</p>
            <p>Best regards,<br>TaskFlow Pro Team</p>
        `;

        await this.sendEmail(to, subject, text, html);
    }

    /**
     * ✅ Send Password Reset Email
     */
    async sendPasswordResetEmail(to, resetToken) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
        const subject = "Reset Your Password";
        const text = `Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`;
        const html = `
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        await this.sendEmail(to, subject, text, html);
    }

    /**
     * ✅ Send Leave Approval/Rejection Email
     */
    async sendLeaveStatusEmail(to, status, leaveDates, leaveReason) {
        const subject = `Your Leave Request has been ${status.toUpperCase()}`;
        const text = `Your leave request (${leaveDates}) has been ${status} by the admin. Reason: ${leaveReason}\n\nPlease check your dashboard for details.`;
        const html = `
            <p>Hello,</p>
            <p>Your leave request for <strong>${leaveDates}</strong> has been <strong style="color: ${status === "approved" ? "green" : "red"};">${status.toUpperCase()}</strong> by the admin.</p>
            <p><strong>Reason:</strong> ${leaveReason}</p>
            <p>Please check your dashboard for details.</p>
            <p>Best regards,<br>TaskFlow Pro Team</p>
        `;

        await this.sendEmail(to, subject, text, html);
    }

    /**
     * ✅ Send Staff Credentials Email (NEW FUNCTION)
     */
    async sendStaffCredentialsEmail(to, staffId, password) {
        const subject = "Your TaskFlow Pro Staff Credentials";
        const text = `Welcome to TaskFlow Pro!\n\nYour login credentials:\nStaff ID: ${staffId}\nPassword: ${password}\n\nPlease log in and change your password after first login.\n\nBest regards,\nTaskFlow Pro Team`;
        const html = `
            <p>Welcome to <strong>TaskFlow Pro</strong>!</p>
            <p>Your login credentials:</p>
            <ul>
                <li><strong>Staff ID:</strong> ${staffId}</li>
                <li><strong>Password:</strong> ${password}</li>
            </ul>
            <p>Please log in and change your password after first login.</p>
            <p>Best regards,<br>TaskFlow Pro Team</p>
        `;

        await this.sendEmail(to, subject, text, html);
    }
}

module.exports = new EmailService();
