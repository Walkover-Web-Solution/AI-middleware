import { StatusCodes } from 'http-status-codes';

/* eslint-disable-next-line */
const errorHandlerMiddleware = (err, _, res, next) => {
  const defaultError = {
    StatusCodes: err?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err?.message || 'Something went wrong, try again later',
    data: err?.data || {},
  };
  if (err.name === 'ValidationError') {
    // we are handeling missing value as well as valid email
    defaultError.StatusCodes = StatusCodes.BAD_REQUEST;
    // defaultError.msg = err.message;
    defaultError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(',');
  }
  return res.status(defaultError.StatusCodes).json({ message: defaultError.msg, data: defaultError.data });
};

export default errorHandlerMiddleware;
