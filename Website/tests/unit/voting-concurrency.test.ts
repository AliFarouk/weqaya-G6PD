import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';

describe('Atomic Voting & Concurrency Engine (§7.3)', () => {
  let testItemId: number;
  const testUserIds: number[] = [];

  beforeAll(async () => {
    // 1. Create dedicated test item with 0 initial votes
    const item = await db.createItem({
      name: 'صنف اختبار التزامن الفوري',
      category: 'food',
    });
    testItemId = item.id;

    // 2. Create 200 distinct test users to satisfy Foreign Key constraints
    for (let i = 1; i <= 200; i++) {
      const user = await db.createUser({
        name: `مستخدم تجريبي ${i}`,
        identifier: `test_user_${i}_${Date.now()}@weqaya.test`,
        password_hash: '$argon2id$test',
        is_doctor: false,
      });
      testUserIds.push(user.id);
    }
  });

  it('200 parallel votes from 200 distinct users results in exact counters', async () => {
    const totalUsers = 200;
    const votesToSubmit: Promise<any>[] = [];

    // 150 safe votes, 50 hemolysis votes
    for (let i = 0; i < totalUsers; i++) {
      const userId = testUserIds[i];
      const voteType = i < 150 ? 'safe' : 'hemolysis';
      votesToSubmit.push(db.executeAtomicVote(userId, testItemId, voteType));
    }

    await Promise.all(votesToSubmit);

    const updated = await db.getItemById(testItemId);
    expect(updated).not.toBeNull();
    expect(updated?.safe_votes).toBe(150);
    expect(updated?.hemolysis_votes).toBe(50);
    expect(updated?.total_votes).toBe(200);
  });

  it('same user firing 50 parallel votes records exactly 1 vote row and consistent counters', async () => {
    const singleUserId = testUserIds[0];
    const parallelCalls = 50;

    // Switch this user to hemolysis 50 times in parallel
    const promises = Array.from({ length: parallelCalls }, () =>
      db.executeAtomicVote(singleUserId, testItemId, 'hemolysis')
    );

    await Promise.all(promises);

    const updated = await db.getItemById(testItemId, singleUserId);
    expect(updated?.user_vote).toBe('hemolysis');
    // Switched from safe to hemolysis: safe decreased by 1 (150 -> 149), hemolysis increased by 1 (50 -> 51), total stays 200
    expect(updated?.safe_votes).toBe(149);
    expect(updated?.hemolysis_votes).toBe(51);
    expect(updated?.total_votes).toBe(200);
  });

  it('switching vote type under load stays consistent', async () => {
    const singleUserId = testUserIds[0];

    // Switch back from hemolysis to safe
    const result = await db.executeAtomicVote(singleUserId, testItemId, 'safe');
    expect(result.item.user_vote).toBe('safe');
    expect(result.stats.hemolysis_votes).toBe(50);
    expect(result.stats.safe_votes).toBe(150);
    expect(result.stats.total_votes).toBe(200);
  });

  it('reconciliation audit reconciles votes accurately', async () => {
    const audit = await db.reconcileCounters();
    // After reconciliation, all items must be in exact sync
    const secondAudit = await db.reconcileCounters();
    expect(secondAudit.driftsFound).toBe(0);
  });
});
