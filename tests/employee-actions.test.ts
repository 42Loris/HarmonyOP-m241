import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleActionItemAction } from '@/actions/employee-actions';
import { calculateProgressRatio } from '@/lib/utils';
import { db } from '@/db';
import { onboardingWorkflows, workflowTasks } from '@/db/schema';
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
      workflowTasks: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      }
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

describe('calculateProgressRatio', () => {
  it('should explicitly ignore IT and Hardware tasks', () => {
    const tasks = [
      { id: '1', taskType: 'IT_ACCESS', status: 'PENDING' },
      { id: '2', taskType: 'HARDWARE', status: 'PENDING' },
      { id: '3', taskType: 'TRAINING', status: 'DONE' },
      { id: '4', taskType: 'HR_ADMIN', status: 'PENDING' },
    ];
    // Employee tasks: #3 (DONE) and #4 (PENDING). Total 2. Completed 1. Ratio = 50.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(calculateProgressRatio(tasks as any)).toBe(50);
  });

  it('should handle the Zero Employee Tasks edge case by returning 100', () => {
    const tasks = [
      { id: '1', taskType: 'IT_ACCESS', status: 'PENDING' },
      { id: '2', taskType: 'HARDWARE', status: 'PENDING' },
    ];
    // No employee tasks. Should return 100.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(calculateProgressRatio(tasks as any)).toBe(100);
  });

  it('should handle exactly 100% completion', () => {
    const tasks = [
      { id: '1', taskType: 'TRAINING', status: 'DONE' },
      { id: '2', taskType: 'HR_ADMIN', status: 'DONE' },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(calculateProgressRatio(tasks as any)).toBe(100);
  });
});

describe('toggleActionItemAction', () => {
  const mockWorkflowId = 'test-wf-id';
  const mockTaskId = 'test-task-id';
  const mockDbUser = { id: 'user-id', authId: 'auth-id', orgId: 'org-id', role: 'EMPLOYEE' };

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.users.findFirst as any).mockResolvedValue(mockDbUser);
  });

  it('should toggle a pending task to DONE and update progress ratio', async () => {
    const mockWorkflow = {
      id: mockWorkflowId,
      newHireId: 'user-id',
      orgId: 'org-id',
    };
    const mockTask = {
      id: mockTaskId,
      workflowId: mockWorkflowId,
      status: 'PENDING',
    };
    const mockAllTasks = [
      { id: mockTaskId, taskType: 'TRAINING', status: 'DONE' } // assuming it's DONE after update
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.onboardingWorkflows.findFirst as any).mockResolvedValue(mockWorkflow);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.workflowTasks.findFirst as any).mockResolvedValue(mockTask);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.workflowTasks.findMany as any).mockResolvedValue(mockAllTasks);

    const result = await toggleActionItemAction(mockWorkflowId, mockTaskId);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(workflowTasks);
    expect(db.update).toHaveBeenCalledWith(onboardingWorkflows); // to set progressRatio
    expect(revalidatePath).toHaveBeenCalledWith('/app/dashboard');
  });
});