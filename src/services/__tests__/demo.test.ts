import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';
import { db } from '../../offline/db';
import { loadDemoData } from '../demo.service';

describe('demo seed', () => {
  beforeEach(async () => {
    // Ensure a clean DB
    try {
      await db.delete();
    } catch (e) {}
    try {
      await db.open();
    } catch (e) {}
  });

  it('creates demo empresa and associates demo obra and users', async () => {
    await loadDemoData();

    const obra = await db.table('obras').get('demo-obra-1');
    expect(obra).toBeTruthy();
    expect((obra as any).empresaId).toBe('demo-empresa-1');

    const prev = await db.table('users').get('demo-prevencionista-1');
    expect(prev).toBeTruthy();
    expect((prev as any).companyId).toBe('demo-empresa-1');

    const workerUser = await db.table('users').get('demo-user-worker-1');
    expect(workerUser).toBeTruthy();
    expect((workerUser as any).companyId).toBe('demo-empresa-1');
  });
});