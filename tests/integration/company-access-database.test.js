import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { seedPermissions } from '../../prisma/seed/permissions.seed.js';
import { loadEnvironment } from '../../src/config/environment.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { createAccessTokenService } from '../../src/core/security/access-token.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  matchesRefreshToken,
  parseRefreshCookie,
  serializeRefreshCookie,
} from '../../src/core/security/refresh-token.js';
import { createAuthRepository } from '../../src/modules/auth/auth.repository.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import { createCompanyAccessRepository } from '../../src/modules/company-access/company-access.repository.js';
import { createCompanyAccessService } from '../../src/modules/company-access/company-access.service.js';
import { provisionCompanyRoles } from '../../src/modules/company-access/company-role-templates.js';

const databaseSuite = process.env.TEST_DATABASE_URL ? describe : describe.skip;

databaseSuite('company access database isolation', () => {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
  let prisma;
  let service;
  let authService;
  let user;
  let country;
  let department;
  let municipality;
  let district;
  let companyA;
  let companyB;

  beforeAll(async () => {
    const environment = loadEnvironment({ ...process.env, NODE_ENV: 'test' });
    prisma = createPrismaClient({ databaseUrl: environment.databaseUrl });
    await prisma.$connect();
    await seedPermissions(prisma);

    country = await prisma.country.create({
      data: {
        name: `El Salvador ${suffix}`,
        abbreviation: `S${suffix.slice(0, 3)}`,
        mhCode: suffix.slice(0, 5),
      },
    });
    department = await prisma.department.create({
      data: {
        name: `Department ${suffix}`,
        abbreviation: suffix.slice(0, 10),
        mhCode: suffix.slice(0, 5),
        zone: 1,
      },
    });
    municipality = await prisma.municipality.create({
      data: {
        departmentId: department.id,
        name: `Municipality ${suffix}`,
        mhCode: suffix.slice(0, 5),
      },
    });
    district = await prisma.district.create({
      data: {
        municipalityId: municipality.id,
        name: `District ${suffix}`,
        mhCode: suffix.slice(0, 5),
      },
    });
    user = await prisma.user.create({
      data: {
        email: `owner-${suffix.toLowerCase()}@example.test`,
        passwordHash: 'not-used-by-this-test',
        displayName: 'Company Owner',
      },
    });
    const companyData = (label) => ({
      code: `${label}_${suffix}`,
      legalName: `${label} ${suffix}, S.A. de C.V.`,
      commercialName: `${label} ${suffix}`,
      nit: `${label}-NIT-${suffix}`,
      nrc: `${label}-NRC-${suffix}`,
      countryId: country.id,
      departmentId: department.id,
      municipalityId: municipality.id,
      districtId: district.id,
      addressLine: 'Test address',
    });
    companyA = await prisma.company.create({ data: companyData('A') });
    companyB = await prisma.company.create({ data: companyData('B') });
    await prisma.$transaction((transaction) =>
      provisionCompanyRoles(transaction, companyA.id),
    );
    await prisma.$transaction((transaction) =>
      provisionCompanyRoles(transaction, companyB.id),
    );
    service = createCompanyAccessService({
      repository: createCompanyAccessRepository(prisma),
      runInTransaction: (operation, options) =>
        prisma.$transaction(operation, options),
    });
    authService = createAuthService({
      repository: createAuthRepository(prisma),
      accessTokens: createAccessTokenService({
        secret: 'company-session-test-secret-longer-than-32-characters',
        expiresIn: '10m',
        issuer: 'nexora-test',
        audience: 'nexora-test-api',
      }),
      refreshTokens: {
        generate: generateRefreshToken,
        hash: hashRefreshToken,
        matches: matchesRefreshToken,
        parse: parseRefreshCookie,
        serialize: serializeRefreshCookie,
      },
      passwordVerifier: async () => true,
      passwordHasher: async () => 'not-used',
      refreshTokenExpiresInDays: 1,
    });
  }, 60_000);

  afterAll(async () => {
    if (!prisma) return;
    if (user)
      await prisma.authSession.deleteMany({ where: { userId: user.id } });
    await prisma.companyMembership.deleteMany({
      where: {
        companyId: { in: [companyA?.id, companyB?.id].filter(Boolean) },
      },
    });
    await prisma.companyRole.deleteMany({
      where: {
        companyId: { in: [companyA?.id, companyB?.id].filter(Boolean) },
      },
    });
    await prisma.company.deleteMany({
      where: { id: { in: [companyA?.id, companyB?.id].filter(Boolean) } },
    });
    if (user) await prisma.user.deleteMany({ where: { id: user.id } });
    if (district)
      await prisma.district.deleteMany({ where: { id: district.id } });
    if (municipality)
      await prisma.municipality.deleteMany({ where: { id: municipality.id } });
    if (department)
      await prisma.department.deleteMany({ where: { id: department.id } });
    if (country) await prisma.country.deleteMany({ where: { id: country.id } });
    await prisma.$disconnect();
  }, 30_000);

  it('rejects cross-company roles and protects the final owner', async () => {
    const ownerA = await prisma.companyRole.findUniqueOrThrow({
      where: { companyId_code: { companyId: companyA.id, code: 'OWNER' } },
    });
    const ownerB = await prisma.companyRole.findUniqueOrThrow({
      where: { companyId_code: { companyId: companyB.id, code: 'OWNER' } },
    });

    await expect(
      service.addMembership(
        companyA.id,
        { email: user.email, roleIds: [ownerB.id] },
        user.id,
        { actorUserId: user.id, requestId: `cross-${suffix}` },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    const membership = await service.addMembership(
      companyA.id,
      { email: user.email, roleIds: [ownerA.id] },
      user.id,
      { actorUserId: user.id, requestId: `owner-${suffix}` },
    );
    expect(membership.companyId).toBe(companyA.id);

    await expect(
      service.getMembership(companyB.id, membership.id),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    await expect(
      service.changeMembershipStatus(
        companyA.id,
        membership.id,
        {
          status: 'SUSPENDED',
          expectedUpdatedAt: membership.updatedAt.toISOString(),
        },
        { actorUserId: user.id, requestId: `suspend-${suffix}` },
      ),
    ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT' });
  }, 30_000);

  it('creates a selection session and securely switches tenant context', async () => {
    const ownerB = await prisma.companyRole.findUniqueOrThrow({
      where: { companyId_code: { companyId: companyB.id, code: 'OWNER' } },
    });
    await service.addMembership(
      companyB.id,
      { email: user.email, roleIds: [ownerB.id] },
      user.id,
      { actorUserId: user.id, requestId: `owner-b-${suffix}` },
    );

    const login = await authService.login({
      email: user.email,
      password: 'not-checked',
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    expect(login.requiresCompanySelection).toBe(true);
    expect(login.activeMembership).toBeNull();

    const initialAuth = await authService.authenticate(login.accessToken);
    expect(initialAuth.companyId).toBeNull();
    const switched = await authService.switchCompany({
      userId: user.id,
      sessionId: initialAuth.sessionId,
      companyId: companyB.id,
      refreshCookie: login.refreshCookie,
    });
    const companyAuth = await authService.authenticate(switched.accessToken);
    expect(companyAuth).toMatchObject({
      companyId: companyB.id,
      membershipId: switched.activeMembership.id,
    });
  }, 30_000);
});
