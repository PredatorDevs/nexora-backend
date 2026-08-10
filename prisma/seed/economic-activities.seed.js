import { loadEconomicActivities } from './economic-activities.data.js';
import { mapWithConcurrency } from './seed.utils.js';

export async function seedEconomicActivities(prisma) {
  const activities = await loadEconomicActivities();

  await mapWithConcurrency(activities, (activity) =>
    prisma.economicActivity.upsert({
      where: { code: activity.code },
      create: activity,
      update: activity,
    }),
  );

  return activities.length;
}
