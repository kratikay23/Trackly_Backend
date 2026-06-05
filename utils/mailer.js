import nodemailer from "nodemailer";

const getTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });

export const sendMail = ({ to, subject, html }) =>
  new Promise((resolve, reject) => {
    getTransporter().sendMail(
      { from: process.env.SENDGRID_FROM, to, subject, html },
      (error) => (error ? reject(error) : resolve(true))
    );
  });
