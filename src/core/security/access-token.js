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
    async sign({
      userId,
      sessionId,
      securityVersion,
      companyId = null,
      membershipId = null,
      membershipSecurityVersion = null,
    }) {
      return new SignJWT({
        sid: sessionId,
        securityVersion,
        ...(companyId == null
          ? {}
          : { companyId, membershipId, membershipSecurityVersion }),
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

      const hasCompanyContext = payload.companyId != null;
      if (
        hasCompanyContext !== (payload.membershipId != null) ||
        hasCompanyContext !== (payload.membershipSecurityVersion != null) ||
        (hasCompanyContext &&
          (!Number.isSafeInteger(payload.companyId) ||
            !Number.isSafeInteger(payload.membershipId) ||
            !Number.isInteger(payload.membershipSecurityVersion)))
      ) {
        throw new Error('Access token company claims are invalid.');
      }

      const userId = Number(payload.sub);
      if (!Number.isSafeInteger(userId) || userId < 1) {
        throw new Error('Access token subject is invalid.');
      }

      return {
        userId,
        sessionId: payload.sid,
        securityVersion: payload.securityVersion,
        companyId: hasCompanyContext ? payload.companyId : null,
        membershipId: hasCompanyContext ? payload.membershipId : null,
        membershipSecurityVersion: hasCompanyContext
          ? payload.membershipSecurityVersion
          : null,
      };
    },
  };
}
