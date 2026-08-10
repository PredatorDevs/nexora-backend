import { provisionCompanyRoles } from '../../src/modules/company-access/company-role-templates.js';

export async function seedCompanyRoles(prisma) {
  const companies = await prisma.company.findMany({ select: { id: true } });
  for (const company of companies) {
    await prisma.$transaction((transaction) =>
      provisionCompanyRoles(transaction, company.id),
    );
  }
  return companies.length;
}
