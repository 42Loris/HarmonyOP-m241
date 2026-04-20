import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleActionItemAction } from '@/actions/employee-actions';
import { db } from '@/db';
import { onboardingWorkflows } from '@/db/schema';
import { revalidatePath } from 'next/cache';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      onboardingWorkflows: {
        findFirst: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      })),
    })),
  },
}));

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } } }),
    },
  })),
}));

describe('toggleActionItemAction', () => {
  const mockWorkflowId = 'test-id';
  const mockItemKey = 'test-item';
  const mockDbUser = { id: 'user-id', authId: 'auth-id', orgId: 'org-id', role: 'EMPLOYEE' };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.users.findFirst as any).mockResolvedValue(mockDbUser);
  });

  it('should return error if unauthorized', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.users.findFirst as any).mockResolvedValue(null);
    const result = await toggleActionItemAction(mockWorkflowId, mockItemKey);
    expect(result).toEqual({ error: 'User not found' });
  });

  it('should throw an error if workflow is not found or unauthorized', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.onboardingWorkflows.findFirst as any).mockResolvedValue(null);

    const result = await toggleActionItemAction(mockWorkflowId, mockItemKey);

    expect(result).toEqual({ error: 'Workflow not found or access denied' });
  });

  it('should add an item to an empty completed list', async () => {
    const mockWorkflow = {
      id: mockWorkflowId,
      newHireId: 'user-id',
      orgId: 'org-id',
      completedActionItems: '[]',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.onboardingWorkflows.findFirst as any).mockResolvedValue(mockWorkflow);

    const result = await toggleActionItemAction(mockWorkflowId, mockItemKey);

    expect(result.success).toBe(true);
    expect(result.completedItems).toContain(mockItemKey);
    expect(db.update).toHaveBeenCalledWith(onboardingWorkflows);
    expect(revalidatePath).toHaveBeenCalledWith('/app/dashboard');
  });

  it('should remove an item if it already exists in the list', async () => {
    const mockWorkflow = {
      id: mockWorkflowId,
      newHireId: 'user-id',
      orgId: 'org-id',
      completedActionItems: JSON.stringify([mockItemKey, 'other-item']),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.onboardingWorkflows.findFirst as any).mockResolvedValue(mockWorkflow);

    const result = await toggleActionItemAction(mockWorkflowId, mockItemKey);

    expect(result.success).toBe(true);
    expect(result.completedItems).not.toContain(mockItemKey);
    expect(result.completedItems).toContain('other-item');
    expect(db.update).toHaveBeenCalled();
  });

  it('should add an item to an existing list of completed items', async () => {
    const mockWorkflow = {
      id: mockWorkflowId,
      newHireId: 'user-id',
      orgId: 'org-id',
      completedActionItems: JSON.stringify(['other-item']),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.onboardingWorkflows.findFirst as any).mockResolvedValue(mockWorkflow);

    const result = await toggleActionItemAction(mockWorkflowId, mockItemKey);

    expect(result.success).toBe(true);
    expect(result.completedItems).toContain(mockItemKey);
    expect(result.completedItems).toContain('other-item');
    expect(db.update).toHaveBeenCalled();
  });
});
