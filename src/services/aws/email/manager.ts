import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { APP_LOGO_URL, URBN_CONTACT_MAIL, URBN_MAIL_BOT } from '../../../constants';
import { EmailInput, EmailSubject, EmailTemplate, SendEmailInputType } from '../../../types';
import sendTemplatedMail from './template';
dayjs.extend(utc);

const source = URBN_MAIL_BOT;
const logo = APP_LOGO_URL;
const contact = URBN_CONTACT_MAIL;

const templateMap = new Map<EmailSubject, EmailTemplate>([
  [EmailSubject.CONFIRM_EMAIL, EmailTemplate.ConfirmEmailTemplate],
  [EmailSubject.RESET_PASSWORD, EmailTemplate.ResetPasswordTemplate],
  [EmailSubject.SECURITY_ALERT, EmailTemplate.SecurityAlertTemplate],
  [EmailSubject.ACCEPTED_REQUEST, EmailTemplate.AcceptedRequestTemplate],
  [EmailSubject.CELEBRITY_VERIFIED, EmailTemplate.CelebrityVerifiedTemplate],
  [EmailSubject.DECLINED_REQUEST, EmailTemplate.DeclinedRequestTemplate],
  [EmailSubject.GIFT_SHOUTOUT, EmailTemplate.GiftShoutoutTemplate],
  [EmailSubject.SHOUTOUT_RECEIEVED, EmailTemplate.ShoutoutReceivedTemplate],
]);

const sendMail = async (data: SendEmailInputType) => {
  const { emailAddresses, subject, ccTo } = data;
  const template = templateMap.get(subject);
  if (!template) {
    console.log('Email Template not found');
    return;
  }

  const dayObj = dayjs();
  const year = dayObj.year().toString();
  const date = dayObj.utc().toString();
  const mail: EmailInput = {
    logo,
    year,
    contact,
    date,
    ...data,
  };
  await sendTemplatedMail(source, template, emailAddresses, mail, ccTo);
};

export default sendMail;
