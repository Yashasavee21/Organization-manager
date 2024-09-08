import { APIConstants } from '../consts';
import logger from '../logger';

export default function CustomResponse(
  message: string,
  status: string,
  statusCode: number,
  data: any = {},
  error: any = {},
) {
  if (status === APIConstants.Status.Failure && (!message || !error)) {
    // console.error(
    //   '\x1b[31m\x1b[1m%s',
    //   'Error and Message are required for Failure response!',
    // );
    message = message || error;
    error = message || error;
    // throw new Error('Error and Message are required for the Failure response!');
  } else if (status === APIConstants.Status.Warning && !message) {
    // console.log(
    //   '\x1b[31m\x1b[1m%s',
    //   'At least Message is required for Warning response!',
    // );
    // throw new Error('At least Message is required for the Warning response!');
  } else if (!data && !message) {
    // console.log(
    //   '\x1b[31m\x1b[1m%s',
    //   'Sending Message is required when no data in response!',
    // );
    // throw new Error('Sending Message is required when no data in response!');
  }
  const res = {
    message: message,
    status: status,
    statusCode: statusCode,
    data: data,
    error: error,
  };

  // remove data and error if empty
  if (typeof data === 'object' && Object.keys(data).length === 0) {
    delete res.data;
  }
  if (typeof error === 'object' && Object.keys(error).length === 0) {
    delete res.error;
  }
  return res;
}

export function HandleExceptionResponse(
  msg: string,
  err: any,
  statuscode?: number,
) {
  logger.error(err);
  return CustomResponse(
    msg,
    APIConstants.Status.Failure,
    statuscode || APIConstants.StatusCode.InternalServerError,
    {},
    err?.message,
  );
}
