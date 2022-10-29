'use strict';

import { Buffer } from 'buffer';
import * as path from 'path';
import * as crypto from 'crypto';
import nodemailer from 'nodemailer';
const hbs = require('nodemailer-express-handlebars');

const options = {
    viewEngine: {
        extName: '.hbs',
        layoutsDir: path.join(__dirname, '../views/emails/'),
    },
    viewPath: path.join(__dirname, '../views/emails/')
};

const transporter = nodemailer.createTransport({
    //host: 'email-smtp.us-east-1.amazonaws.com',
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // true for 465, false for other ports,
    pool: true,
    rateLimit: 20,
    auth: {
        user: process.env.AWS_SES_USER,
        pass: process.env.AWS_SES_PASS
    }
});
transporter.use('compile', hbs(options));

const BASE_URL = process.env.BASE_URL;
const SENT_FROM = 'support@dumena.com';
// const SENT_FROM = 'noreply@dumena.com';

const sendMail = (to: string, subject: string, template: string, data: object) => {
    const mailOptions = {
        from: '"DUMENA Education" <' + SENT_FROM + '>',
        to: to,
        subject: subject,
        template: template,
        context: data
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error: Error, info: { messageId: string; }) => {
        if (error) {
            return console.log(error);
        }
        // console.log('Message sent: %s', info.messageId);
    });
}

export const emailService = {
    sendVerificationEmail: function (user: any): void {
        const email_b64 = Buffer.from(user.email).toString('base64url');
        const hash = crypto.createHash('md5').update(user.email + process.env.EMAIL_HASH_STRING).digest('hex');

        const data = {
            user: user.fullname,
            url: BASE_URL + '#/activate/' + email_b64 + '/' + hash,
            base_url: BASE_URL
        };
        const subject = "Verify your email address"
        const template = 'verifyAccount';
        sendMail(user.email, subject, template, data);
    },

    sendLearnerLoginDetails: function ({ fullname, username, password, email, parent_name }: Record<string, any>): void {
        const data = {
            parent_name,
            fullname,
            username,
            password
        }
        const subject = `Login Details for ${fullname}`;
        const template = 'loginDetails';
        sendMail(email, subject, template, data);
    },

    sendLauchInviteEmail: function (user: any): void {
        const data = {
            user: user.fullname
        };
        const subject = 'THANK YOU FOR SUCCESSFULLY SIGNING UP';
        const template = 'launchInvite';
        sendMail(user.email, subject, template, data);
    },

    sendSummerSchoolEmail: function (user: any): void {
        const data = {
            user: user.fullname
        };
        const subject = `Thanks for Registering, Here's What's Next 🎉🎊`;
        const template = 'summerSchool';
        sendMail(user.email, subject, template, data);
    },

    sendPasswordResetLink: function (user: any): void {
        if (!user) return;
        const email_b64 = Buffer.from(user.email).toString('base64url');
        const hash = crypto.createHash('md5').update(user.email + process.env.EMAIL_HASH_STRING).digest('hex');

        const data = {
            user: user.fullname,
            url: BASE_URL + '#/password-reset/' + email_b64 + '/' + hash,
            base_url: BASE_URL
        };
        const subject = "DUMENA Password Reset Link";
        const template = 'passwordReset';
        sendMail(user.email, subject, template, data);
    },

    emailDUMENA: function ({ sender_email, sender_name, sender_phone = '', subject = 'From FAQ', message }: any) {
        const template = 'dumenaEmail';
        const data = {
            sender_name,
            sender_email,
            sender_phone,
            message,
            base_url: BASE_URL
        };

        const mailOptions = {
            from: 'DUMENA Education' + '<' + SENT_FROM + '>',
            to: 'hidumena@gmail.com',
            bcc: 'chibuzohenry@gmail.com',
            replyTo: sender_email,
            subject: subject,
            template: template,
            context: data
        };
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error: Error, info: any) => {
            if (error) {
                return console.log(error);
            }
            // console.log('Message sent: %s', info.messageId);
        });
    }
}