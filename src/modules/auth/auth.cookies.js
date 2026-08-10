export function createRefreshCookieOptions({ cookie, expiresAt }) {
  return {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: '/api/v1/auth',
    expires: expiresAt,
  };
}

export function createClearCookieOptions(cookie) {
  return {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: '/api/v1/auth',
  };
}
