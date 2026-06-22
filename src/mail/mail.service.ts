import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type MailDeliveryMode = 'auto' | 'brevo' | 'smtp' | 'log';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly brevoApiKey?: string;
  private readonly deliveryMode: MailDeliveryMode;

  constructor(private readonly configService: ConfigService) {
    this.deliveryMode = this.getDeliveryMode();
    this.brevoApiKey = this.configService.get<string>(process.env.
    BREVO_API_KEY) || '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';

    const host = this.configService.get<string>(process.env.SMTP_HOST);
    const port = Number(this.configService.get<string>(process.env.SMTP_PORT) || 587);
    const user = this.configService.get<string>(process.env.SMTP_USER);
    const pass = this.configService.get<string>(process.env.SMTP_PASS);

    if (this.deliveryMode === 'log') {
      this.logger.warn(
        'Email delivery is disabled. Verification emails will be logged instead of sent.',
      );
      return;
    }

    if (this.deliveryMode === 'brevo') {
      if (!this.brevoApiKey) {
        this.logger.error('BREVO_API_KEY is required when MAIL_DELIVERY=brevo.');
      } else {
        this.logger.log('Brevo API email delivery is enabled.');
      }
      return;
    }

    if (this.deliveryMode === 'auto' && this.brevoApiKey) {
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
      this.configService.get<string>(
        'Blood Match <touraymuhammed2000@gmail.com>',
      ) || this.configService.get<string>('acfbae001@smtp-brevo.com');

    if (this.deliveryMode === 'log') {
      this.logRegistrationCode(email, code);
      return;
    }

    if (this.deliveryMode === 'brevo') {
      if (!this.brevoApiKey) {
        this.logger.error('BREVO_API_KEY is required when MAIL_DELIVERY=brevo.');
        throw new ServiceUnavailableException(
          'Email provider is not configured.',
        );
      }

      if (!from) {
        this.logger.error('MAIL_FROM is required when using Brevo API.');
        throw new ServiceUnavailableException(
          'Email sender is not configured.',
        );
      }
      await this.sendWithBrevoApi(email, code, from);
      return;
    }

    if (this.deliveryMode === 'auto' && this.brevoApiKey) {
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
      if (this.deliveryMode === 'smtp') {
        this.logger.error(
          'SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are required when MAIL_DELIVERY=smtp.',
        );
        throw new ServiceUnavailableException(
          'Email provider is not configured.',
        );
      }

      this.logRegistrationCode(email, code);
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

  private getDeliveryMode(): MailDeliveryMode {
    const mode = this.configService
      .get<string>('MAIL_DELIVERY')
      ?.trim()
      .toLowerCase();

    if (mode === 'brevo' || mode === 'smtp' || mode === 'log') {
      return mode;
    }

    if (mode && mode !== 'auto') {
      this.logger.warn(
        `Unknown MAIL_DELIVERY value "${mode}". Falling back to auto.`,
      );
    }

    return 'auto';
  }

  private logRegistrationCode(email: string, code: string): void {
    this.logger.log(`Registration code for ${email}: ${code}`);
  }
}
