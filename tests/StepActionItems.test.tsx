import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StepActionItems from '@/components/dashboard/steps/StepActionItems';

// Mock the server action
vi.mock('@/actions/employee-actions', () => ({
  toggleActionItemAction: vi.fn().mockResolvedValue({ success: true, completedItems: ['login'] }),
}));

describe('StepActionItems', () => {
  const mockWorkflow = {
    id: 'test-id',
    completedActionItems: '[]',
  };
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  it('should render the list of action items', () => {
    render(<StepActionItems workflow={mockWorkflow as any} onNext={mockOnNext} onBack={mockOnBack} />);
    
    expect(screen.getByText(/Log into Microsoft 365/i)).toBeInTheDocument();
    expect(screen.getByText(/Set up Multi-Factor Auth/i)).toBeInTheDocument();
    expect(screen.getByText(/Review Company Handbook/i)).toBeInTheDocument();
  });

  it('should call onNext when clicking the next arrow', () => {
    render(<StepActionItems workflow={mockWorkflow as any} onNext={mockOnNext} onBack={mockOnBack} />);
    
    const nextButton = screen.getAllByRole('button')[1]; // The second button is next arrow
    fireEvent.click(nextButton);
    
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('should call onBack when clicking the back arrow', () => {
    render(<StepActionItems workflow={mockWorkflow as any} onNext={mockOnNext} onBack={mockOnBack} />);
    
    const backButton = screen.getAllByRole('button')[0]; // The first button is back arrow
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });
});
