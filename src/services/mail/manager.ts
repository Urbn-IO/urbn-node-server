import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { EmailBaseInput, EmailSubject, EmailTemplate, SendEmailInputType } from '../../types';
import sendTemplatedMail from './template';
dayjs.extend(utc);

const source = process.env.URBN_SECURITY_MAIL;
const logo = process.env.APP_LOGO_URL;
const contact = process.env.URBN_CONTACT_MAIL;

const templateMap = new Map<EmailSubject, EmailTemplate>([
  [EmailSubject.CONFIRM, EmailTemplate.ConfirmEmailTemplate],
  [EmailSubject.RESET, EmailTemplate.ResetPasswordTemplate],
  [EmailSubject.SECURITY, EmailTemplate.SecurityAlertTemplate],
]);

const sendMail = async (data: SendEmailInputType) => {
  const { name, emailAddresses, subject, url, sourcePlatform, ccTo } = data;
  const template = templateMap.get(subject);
  if (!template) {
    console.log('Email Template not found');
    return;
  }

  const date = dayjs();
  const year = date.year().toString();
  const time = date.utc().format('HH:mm');
  const mail: EmailBaseInput = {
    name,
    logo,
    year,
    url,
    contact,
    sourcePlatform,
    time,
  };
  await sendTemplatedMail(source, template, emailAddresses, mail, ccTo);
};

export default sendMail;
