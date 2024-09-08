import { createLogger } from 'winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';
import { getSecret } from './secrets';
import SecretKeys from './secrets/keys';
import Opts from './options';

const transports = [];

if (Opts.LOGGING_PARTNER === 'aws-cloudwatch') {
  const accessKeyId = getSecret(SecretKeys.AWS_KEY);
  const secretAccessKey = getSecret(SecretKeys.AWS_SECRET);
  const region = getSecret(SecretKeys.AWS_REGION);
  const logGroupName = getSecret(SecretKeys.AWS_LOG_GROUP);
  const logStreamName = getSecret(SecretKeys.AWS_LOG_STREAM);

  transports.push(
    new WinstonCloudWatch({
      messageFormatter: function (info) {
        return JSON.stringify(info);
      },
      logGroupName,
      logStreamName,
      awsOptions: {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        region,
      },
    }),
  );
}

const logger = createLogger({
  //   format: format.combine(format.json(), ignorePrivate()),
  defaultMeta: {
    service: 'freny',
    pid: process.pid,
    code_version: `${process.env.npm_package_version}`,
    env: process.env.NODE_ENV,
  },
  transports,
});

process.on('uncaughtException', function (err) {
  logger.error('uncaughtException', { message: err.message, stack: err.stack }); // logging with MetaData
});

export default logger;
