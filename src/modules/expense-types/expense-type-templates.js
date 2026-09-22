export const defaultExpenseTypes = Object.freeze([
  ['TRANSPORT', 'Transporte', 'Traslado terrestre local o nacional.'],
  ['FREIGHT', 'Flete', 'Transporte principal nacional o internacional.'],
  ['INSURANCE', 'Seguro', 'Cobertura asociada al transporte de mercancías.'],
  ['CUSTOMS', 'Aduana', 'Trámites y servicios aduanales.'],
  ['HANDLING', 'Manipulación', 'Carga, descarga y manipulación de mercancía.'],
  ['STORAGE', 'Almacenamiento', 'Custodia o almacenamiento temporal.'],
  ['OTHER', 'Otros', 'Otros gastos relacionados con la adquisición.'],
]);

export function provisionExpenseTypes(client, companyId) {
  return client.expenseType.createMany({
    data: defaultExpenseTypes.map(([code, name, description]) => ({
      companyId,
      code,
      name,
      description,
    })),
    skipDuplicates: true,
  });
}
