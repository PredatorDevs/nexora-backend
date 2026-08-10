import { AppError } from '../errors/app-error.js';
import { errorCodes } from '../errors/error-codes.js';

const requestSegments = ['body', 'params', 'query'];

export function validate(schemas) {
  return async function validationMiddleware(request, _response, next) {
    const details = [];
    const validated = {};

    for (const segment of requestSegments) {
      if (!schemas[segment]) continue;

      const result = await schemas[segment].safeParseAsync(request[segment]);

      if (!result.success) {
        details.push(
          ...result.error.issues.map((issue) => ({
            location: segment,
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        );
      } else {
        validated[segment] = result.data;
      }
    }

    if (details.length > 0) {
      return next(
        new AppError({
          code: errorCodes.validation,
          message: 'The request contains invalid data.',
          statusCode: 400,
          details,
        }),
      );
    }

    request.validated = validated;
    return next();
  };
}
