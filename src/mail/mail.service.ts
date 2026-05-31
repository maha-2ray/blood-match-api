import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly brevoApiKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY');

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') || 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (this.brevoApiKey) {
      this.logger.log('Brevo API email delivery is enabled.');
      return;
    }

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email configuration is incomplete. Verification emails will be logged instead of sent.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async sendRegistrationCode(email: string, code: string): Promise<void> {
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('SMTP_USER');

    if (this.brevoApiKey) {
      if (!from) {
        this.logger.error('MAIL_FROM is required when using Brevo API.');
        throw new ServiceUnavailableException(
          'Email sender is not configured.',
        );
      }
      await this.sendWithBrevoApi(email, code, from);
      return;
    }

    if (!this.transporter) {
      this.logger.log(`Registration code for ${email}: ${code}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Your Blood Match verification code',
        text: `Your verification code is ${code}. It expires in 10 minutes.`,
        html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send registration email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        'Unable to send verification email. Please try again.',
      );
    }
  }

  private async sendWithBrevoApi(
    email: string,
    code: string,
    from: string,
  ): Promise<void> {
    const sender = this.parseSender(from);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender,
          to: [{ email }],
          subject: 'Your Blood Match verification code',
          textContent: `Your verification code is ${code}. It expires in 10 minutes.`,
          htmlContent: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo API ${response.status}: ${errorBody}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send registration email to ${email} with Brevo API`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        'Unable to send verification email. Please try again.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseSender(from: string): { email: string; name?: string } {
    const match = from.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
    if (!match) {
      return { email: from.trim() };
    }

    return {
      name: match[1].replace(/^"|"$/g, '').trim(),
      email: match[2].trim(),
    };
  }
}
