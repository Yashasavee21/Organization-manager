const Opts = {
  LOGGING_PARTNER: '',
  SECRETS_SOURCE: 'env',
  ACCESS_TOKEN_EXPIRY: '120m',
  REFRESH_TOKEN_EXPIRY: '14d',
  INVITE_TOKEN_EXPIRY: '2d',
  // day * hrs * minutes * seconds  * ms
  INVITE_TOKEN_EXPIRY_SCHEMA: 2 * 24 * 60 * 60 * 1000,
};

export default Opts;
