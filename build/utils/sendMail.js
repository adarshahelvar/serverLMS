"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
require("dotenv").config();
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail = async (options) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            service: process.env.SMTP_SERVICE,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        const { email, subject, template, data } = options;
        // Get the path to the email template file
        const templatePath = path_1.default.join(__dirname, "../mails", template);
        // Render the email with EJS
        const html = await ejs_1.default.renderFile(templatePath, data);
        // console.log("Email Options:", options);
        // console.log("Mail Options:", {
        //   from: process.env.SMTP_MAIL,
        //   to: email,
        //   subject,
        //   html,
        // });
        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject,
            html,
        };
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
exports.default = sendMail;
