import nodemailer, { Transporter } from "nodemailer";
require("dotenv").config();
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter: Transporter = nodemailer.createTransport({
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
    const templatePath = path.join(__dirname, "../mails", template);

    // Render the email with EJS
    const html: string = await ejs.renderFile(templatePath, data);

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
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendMail;
