export const APIConstants = {
  Status: {
    Success: 'Success',
    Warning: 'Warning',
    Failure: 'Failure',
  },
  StatusCode: {
    Ok: 200,
    NoContent: 204,
    BadRequest: 400,
    NotFound: 404,
    ExistingData: 409,
    InternalServerError: 500,
    ServiceUnavailable: 503,
  },
  Message: {},
  Error: {},
};

export const LOG_TYPES = {
  INFO: 'info',
  DEBUG: 'debug',
  ERROR: 'error',
  WAARNING: 'warinng',
};

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  ONETIME = 'onetime',
}

export const ChannelTypes = {
  ADMIN_PANEL: 'admin-panel',
};

export const IS_PUBLIC_KEY = 'isPublic';
export const SKIP_ORG_AUTH = 'skipOrgAuth';
