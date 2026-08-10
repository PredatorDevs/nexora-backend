export function sendSuccess(
  response,
  data,
  { statusCode = 200, meta = {} } = {},
) {
  return response.status(statusCode).json({
    success: true,
    data,
    meta: {
      ...meta,
      requestId: response.req.id,
    },
  });
}

export function sendError(response, error) {
  const body = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
    meta: {
      requestId: response.req.id,
    },
  };

  return response.status(error.statusCode).json(body);
}
