const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Send verification email
async function sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.BASE_URL}/auth/verify/${token}`;
    
    await transporter.sendMail({
        from: `"Doctor Appointment System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify your email',
        html: `
            <h1>Welcome to Doctor Appointment System!</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create an account, please ignore this email.</p>
        `
    });
}

// Send password reset email
async function sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.BASE_URL}/auth/reset-password/${token}`;
    
    await transporter.sendMail({
        from: `"Doctor Appointment System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your password',
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Please click the link below to reset it:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
        `
    });
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
}; 