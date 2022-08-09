import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { EmailBaseInput, EmailSubject, EmailTemplates, SendEmailInputType } from "../../types";
import sendTemplatedMail from "./sendMail";
dayjs.extend(utc);

const source = process.env.URBN_SECURITY_MAIL;
const logo = process.env.APP_LOGO_URL;
const contact = process.env.URBN_CONTACT_MAIL;
export const sendMail = async (data: SendEmailInputType) => {
  const { name, email, subject, url, sourcePlatform, ccTo } = data;
  let template;
  if (subject === EmailSubject.CONFIRM) template = EmailTemplates.ConfirmEmailTemplate;
  else if (subject === EmailSubject.RESET) template = EmailTemplates.ResetPasswordTemplate;
  else template = EmailTemplates.SecurityAlertTemplate;
  const date = dayjs();
  const year = date.year().toString();
  const time = date.utc().format("HH:mm");
  const mail: EmailBaseInput = {
    name,
    logo,
    year,
    url,
    contact,
    sourcePlatform,
    time,
  };
  await sendTemplatedMail(source, template, email, mail, ccTo);
};
