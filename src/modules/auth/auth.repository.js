export function createAuthRepository(prisma) {
  const sessionUserSelect = {
    id: true,
    email: true,
    displayName: true,
    status: true,
    securityVersion: true,
    mustChangePassword: true,
  };
  const credentialUserSelect = { ...sessionUserSelect, passwordHash: true };
  const membershipSelect = {
    id: true,
    companyId: true,
    status: true,
    securityVersion: true,
    company: {
      select: {
        id: true,
        code: true,
        legalName: true,
        commercialName: true,
        status: true,
      },
    },
  };

  return {
    findUserByEmail(email) {
      return prisma.user.findUnique({
        where: { email },
        select: credentialUserSelect,
      });
    },
    findUserById(userId) {
      return prisma.user.findUnique({
        where: { id: userId },
        select: sessionUserSelect,
      });
    },
    findActiveMemberships(userId) {
      return prisma.companyMembership.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          company: { status: 'ACTIVE' },
        },
        select: membershipSelect,
        orderBy: { company: { legalName: 'asc' } },
      });
    },
    findActiveMembership(userId, companyId) {
      return prisma.companyMembership.findFirst({
        where: {
          userId,
          companyId,
          status: 'ACTIVE',
          company: { status: 'ACTIVE' },
        },
        select: membershipSelect,
      });
    },
    createSession(data) {
      return prisma.authSession.create({ data });
    },
    findSessionById(sessionId) {
      return prisma.authSession.findUnique({
        where: { id: sessionId },
        include: {
          user: { select: sessionUserSelect },
          company: { select: { id: true, status: true } },
          membership: {
            select: {
              id: true,
              companyId: true,
              userId: true,
              status: true,
              securityVersion: true,
            },
          },
        },
      });
    },
    async rotateSession({ sessionId, currentHash, nextHash, now }) {
      const result = await prisma.authSession.updateMany({
        where: {
          id: sessionId,
          refreshTokenHash: currentHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { refreshTokenHash: nextHash, lastUsedAt: now },
      });
      return result.count === 1;
    },
    revokeSession(sessionId, reason, now) {
      return prisma.authSession.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: now, revokedReason: reason },
      });
    },
    revokeFamily(familyId, reason, now) {
      return prisma.authSession.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: now, revokedReason: reason },
      });
    },
    revokeAllForUser(userId, reason, now) {
      return prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now, revokedReason: reason },
      });
    },
    async switchCompany({
      sessionId,
      userId,
      currentHash,
      nextHash,
      companyId,
      membershipId,
      now,
    }) {
      const result = await prisma.authSession.updateMany({
        where: {
          id: sessionId,
          userId,
          refreshTokenHash: currentHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          companyId,
          membershipId,
          refreshTokenHash: nextHash,
          lastUsedAt: now,
        },
      });
      return result.count === 1;
    },
    updateProfile(userId, displayName) {
      return prisma.user.update({
        where: { id: userId },
        data: { displayName },
        select: sessionUserSelect,
      });
    },
    async changePassword({ userId, passwordHash, currentSessionId, now }) {
      return prisma.$transaction(async (transaction) => {
        const user = await transaction.user.update({
          where: { id: userId },
          data: {
            passwordHash,
            mustChangePassword: false,
            securityVersion: { increment: 1 },
          },
          select: sessionUserSelect,
        });
        await transaction.authSession.updateMany({
          where: { userId, id: { not: currentSessionId }, revokedAt: null },
          data: { revokedAt: now, revokedReason: 'PASSWORD_CHANGED' },
        });
        return user;
      });
    },
  };
}
