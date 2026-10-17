import { db } from '../src/lib/db';

async function main() {
  console.log('🔍 [Weqaya Audit] Running counters reconciliation audit...');
  const result = await db.reconcileCounters();
  console.log(`✅ [Weqaya Audit] Reconciled ${result.reconciledCount} items. Discrepancies found & fixed: ${result.driftsFound}`);
}

main().catch((err) => {
  console.error('[Weqaya Audit Error]:', err);
  process.exit(1);
});
