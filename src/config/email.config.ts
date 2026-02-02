import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  user: process.env.GMAIL_USER,
  password: process.env.GMAIL_APP_PASSWORD,
  fromEmail: process.env.EMAIL_FROM || process.env.GMAIL_USER || 'support@kamtechstore.com',
  fromName: process.env.EMAIL_FROM_NAME || 'KamTech Store',
}));
