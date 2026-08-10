import request from 'supertest';

export function bearerRequest(app, accessToken, method, path) {
  const agent = request(app);
  return agent[method](path).set('authorization', `Bearer ${accessToken}`);
}

export function responseCookie(response) {
  const setCookie = response.headers['set-cookie'];
  if (!setCookie?.[0]) throw new Error('The response did not set a cookie');
  return setCookie[0].split(';')[0];
}
