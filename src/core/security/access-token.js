import { SignJWT, jwtVerify } from 'jose';

const algorithm = 'HS256';

export function createAccessTokenService({
  secret,
  expiresIn,
  issuer,
  audience,
}) {
  const key = new TextEncoder().encode(secret);

  return {
    async sign({ userId, sessionId, securityVersion }) {
      return new SignJWT({
        sid: sessionId,
        securityVersion,
      })
        .setProtectedHeader({ alg: algorithm, typ: 'JWT' })
        .setSubject(String(userId))
        .setIssuer(issuer)
        .setAudience(audience)
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(key);
    },

    async verify(token) {
      const { payload } = await jwtVerify(token, key, {
        algorithms: [algorithm],
        issuer,
        audience,
      });

      if (
        !payload.sub ||
        typeof payload.sid !== 'string' ||
        !Number.isInteger(payload.securityVersion)
      ) {
        throw new Error('Access token claims are invalid.');
      }

      const userId = Number(payload.sub);
      if (!Number.isSafeInteger(userId) || userId < 1) {
        throw new Error('Access token subject is invalid.');
      }

      return {
        userId,
        sessionId: payload.sid,
        securityVersion: payload.securityVersion,
      };
    },
  };
}
