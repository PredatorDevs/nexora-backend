import { randomUUID } from 'node:crypto';

const requestIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/;

export function requestId(request, response, next) {
  const suppliedRequestId = request.get('x-request-id');
  request.id = requestIdPattern.test(suppliedRequestId ?? '')
    ? suppliedRequestId
    : randomUUID();

  response.set('x-request-id', request.id);
  next();
}
