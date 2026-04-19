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
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      })),
    })),
  },
}));

describe('toggleActionItemAction', () => {
  const mockWorkflowId = 'test-id';
  const mockItemKey = 'test-item';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if workflow is not found', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.onboardingWorkflows.findFirst as any).mockResolvedValue(null);

    const result = await toggleActionItemAction(mockWorkflowId, mockItemKey);

    expect(result).toEqual({ success: false, error: 'Failed to update checklist' });
  });

  it('should add an item to an empty completed list', async () => {
    const mockWorkflow = {
      id: mockWorkflowId,
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
