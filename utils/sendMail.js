const nodemailer = require("nodemailer");
require("dotenv").config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
module.exports.sendMail = async (email, subject, html) => {
  const mailOptions = {
    form: process.env.SMTP_USER,
    to: email,
    subject: subject,
    html: html,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.log(error);
    else {
      console.log("Email send: " + info.response);
    }
  });
};
