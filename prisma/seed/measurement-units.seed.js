import { loadMeasurementUnits } from './measurement-units.data.js';
import { mapWithConcurrency } from './seed.utils.js';

export async function seedMeasurementUnits(prisma) {
  const units = await loadMeasurementUnits();

  await mapWithConcurrency(units, (unit) =>
    prisma.measurementUnit.upsert({
      where: { name: unit.name },
      create: unit,
      update: unit,
    }),
  );

  return units.length;
}
