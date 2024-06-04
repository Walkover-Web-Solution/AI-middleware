import { StatusCodes } from 'http-status-codes';

/* eslint-disable-next-line */
const errorHandlerMiddleware = (err, _, res, next) => {
  const defaultError = {
    StatusCodes: err?.statusCode || StatusCodes.BAD_REQUEST,
    msg: err?.message || 'Something went wrong, try again later',
    data: err?.data || {},
  };
  if (err.name === 'ValidationError') {
    // we are handeling missing value as well as valid email
    defaultError.StatusCodes = StatusCodes.UNPROCESSABLE_ENTITY;
    // defaultError.msg = err.message;
    defaultError.data = undefined;
  }
  return res.status(defaultError.StatusCodes).json({ message: defaultError.msg, data: defaultError.data });
};

export default errorHandlerMiddleware;
