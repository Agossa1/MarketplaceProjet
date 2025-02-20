import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
    console.log('Initializing email sending process');

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER || 'biogeographierecherches@gmail.com',
            pass: process.env.EMAIL_PASS || 'fkrj jgmn svzc ibdw'
        },
    });

    console.log('Transporter created with config:', {
        host: transporter.options.host,
        port: transporter.options.port,
        secure: transporter.options.secure,
        auth: { user: transporter.options.auth.user }
    });

    const mailOptions = {
        from: options.from || `"BenMarket" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    console.log('Preparing to send email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
    });

    try {
        console.log('Verifying SMTP connection');
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        console.log('Sending email');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error in sendEmail:', error);
        throw new Error('Failed to send email: ' + error.message);
    }
};

export { sendEmail };
