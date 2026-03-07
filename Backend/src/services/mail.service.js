const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (to, subject, text) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text
    });

    return true;

  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
};

module.exports = sendMail;
