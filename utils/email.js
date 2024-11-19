const nodemailer = require("nodemailer");
const pug = require("pug");
const { convert } = require("html-to-text");
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Duth Nguyen <${process.env.EMAIL_FROM}>`;
  }
  createTransport() {
    if (process.env.NODE_ENV === "production") {
      //Send Grid
      return 1;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  async send(template, subject) {
    // Send the actual email;
    //1. Render HTML based on Pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    //2. Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: convert(html),
    };

    //3. Create a transpont and send the email
    await this.createTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
};

// const sendEmail = async (options) => {
//   //1. Create the transporter
//   // const transporter = nodemailer.createTransport({
//   //   host: process.env.EMAIL_HOST,
//   //   port: process.env.EMAIL_PORT,
//   //   auth: {
//   //     user: process.env.EMAIL_USERNAME,
//   //     pass: process.env.EMAIL_PASSWORD,
//   //   },
//   // });
//   //2. Define the email options
//   // const mailOptions = {
//   //   from: "Duth Nguyen <rumduth1@gmail.com>",
//   //   to: options.email,
//   //   subject: options.subject,
//   //   text: options.message,
//   //   // html:
//   // };
//   //3. Actually send the email with nodemailer

//   // await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
