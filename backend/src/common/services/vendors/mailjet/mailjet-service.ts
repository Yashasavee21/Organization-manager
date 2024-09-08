import { Injectable } from '@nestjs/common';
import { Client, LibraryResponse, SendEmailV3_1 } from 'node-mailjet';
import { getSecret } from 'src/common/secrets';
import SecretKeys from 'src/common/secrets/keys';
import { vendorConsts } from '../consts';
import { EmailParams } from './interface';
import logger from 'src/common/logger';

@Injectable()
export class MailService {
  private mj: Client;

  constructor() {
    this.mj = new Client({
      apiKey: getSecret(SecretKeys.VENDOR_MAILJET_KEY),
      apiSecret: getSecret(SecretKeys.VENDOR_MAILJET_SECRET),
    });
  }

  async sendEmail(params: EmailParams) {
    const { toEmail, toName, inviteurl } = params;

    const data: SendEmailV3_1.Body = {
      Messages: [
        {
          From: {
            Email: getSecret(SecretKeys.VENDOR_MAILJET_EMAIL),
            Name: getSecret(SecretKeys.VENDOR_MAILJET_EMAIL_NAME),
          },
          To: [{ Email: toEmail, Name: toName }],
          TemplateID: vendorConsts.MAILJET_SEND_INVITE_TEMPLATE_ID,
          Variables: { inviteurl: inviteurl },
          Headers: { TemplateLanguage: vendorConsts.MAILJET_TEMPLATE_LANGUAGE },
        },
      ],
    };

    try {
      const result: LibraryResponse<SendEmailV3_1.Response> = await this.mj
        .post('send', { version: vendorConsts.MAILJET_VERSION })
        .request(data);

      if (result?.body?.Messages?.[0]?.Status === 'success') {
        return result.body.Messages;
      } else {
        logger.error(result.body.Messages);
        return false;
      }
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }
}
