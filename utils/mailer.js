import sgMail from "@sendgrid/mail";

const getFromAddress = () => {
  const email = process.env.SENDGRID_FROM;
  const name = process.env.SENDGRID_FROM_NAME;
  if (!email) throw new Error("SENDGRID_FROM is not configured");
  return name ? { email, name } : email;
};

export const sendMail = async ({ to, subject, html }) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY is not configured");

  sgMail.setApiKey(apiKey);
  await sgMail.send({
    to,
    from: getFromAddress(),
    subject,
    html,
  });
  return true;
};
