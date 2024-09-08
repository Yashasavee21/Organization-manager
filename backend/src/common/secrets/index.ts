import 'dotenv/config';
import SecretKeys from './keys';
import Opts from '../options';
export function getSecret(key: string) {
  if (!SecretKeys[key]) throw new Error(`Invalid Secret Key Requested ${key}`);

  if (Opts.SECRETS_SOURCE === 'env') return process.env[key];

  throw new Error(`Invalid Secret Source Requested ${key}`);
}
