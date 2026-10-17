import { db } from '../src/lib/db';

async function main() {
  console.log('🌿 [Weqaya Seed] Initializing demo seed data...');
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SEEDING DEMO DATA IS STRICTLY PROHIBITED IN PRODUCTION ENVIRONMENT.');
    process.exit(1);
  }

  const count = await db.seedDemoItems(true);
  console.log(`✅ [Weqaya Seed] Successfully seeded ${count} illustrative Egyptian market items.`);
  console.log('⚠️ Reminder: These items are demo-only and must not be presented to real patients as verified stats.');
}

main().catch((err) => {
  console.error('[Weqaya Seed Error]:', err);
  process.exit(1);
});
