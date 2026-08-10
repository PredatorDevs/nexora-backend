export function auditRequestContext(request) {
  return {
    requestId: request.id,
    ipAddress: request.ip ?? null,
    userAgent: request.get('user-agent')?.slice(0, 512) ?? null,
    companyId: request.auth?.companyId ?? null,
    membershipId: request.auth?.membershipId ?? null,
  };
}
