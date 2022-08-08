import { EmailBaseInput, EmailSubject, EmailTemplates, SendEmailType } from "../../types";
import sendTemplatedMail from "./sendMail";

const source = process.env.URBN_SECURITY_MAIL;
const logo = process.env.APP_LOGO_URL;
const contact = process.env.URBN_CONTACT_MAIL;
export const sendMail = async (data: SendEmailType) => {
  const { name, email, subject, url, ccTo } = data;
  let template;
  if (subject === EmailSubject.CONFIRM) template = EmailTemplates.ConfirmEmailTemplate;
  else template = EmailTemplates.ResetPasswordTemplate;
  const year = new Date().getFullYear().toString();
  const mail: EmailBaseInput = {
    name,
    logo,
    year,
    url,
    contact,
  };
  await sendTemplatedMail(source, template, email, mail, ccTo);
};
