const nodeMailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
// const Transport = require('nodemailer-brevo-transport');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.url = url;
    this.firstName = user.name.split(' ')[0];
    this.from = `Aryan <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // const transporter = nodeMailer.createTransport(
      //   new Transport({ apiKey: 'my-api-key' })
      // );
      const {
        BREVO_EMAIL_USERNAME,
        BREVO_EMAIL_PASSWORD,
        BREVO_EMAIL_HOST,
        BREVO_EMAIL_PORT
      } = process.env;
      return nodeMailer.createTransport({
        //SendGrid -> Brevo
        host: BREVO_EMAIL_HOST,
        port: BREVO_EMAIL_PORT,
        auth: { user: BREVO_EMAIL_USERNAME, pass: BREVO_EMAIL_PASSWORD }
      });
    }

    return nodeMailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    try {
      const html = pug.renderFile(
        `${__dirname}/../views/email/${template}.pug`,
        {
          firstName: this.firstName,
          url: this.url,
          subject
        }
      );
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.fromString(html)
      };
      const result = await this.newTransport().sendMail(mailOptions);
      // console.log('Email sent successfully:', result.response);
    } catch (error) {
      console.error('Email sending failed:', error.message);
      throw error;
    }
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
