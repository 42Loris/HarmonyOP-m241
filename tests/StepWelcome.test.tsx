import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StepWelcome from '@/components/dashboard/steps/StepWelcome';

describe('StepWelcome', () => {
  const mockUser = { name: 'John Doe', department: 'Engineering' };
  const mockWorkflow = { progressRatio: 50 };
  const mockOnNext = vi.fn();

  it('should render the welcome message with user name', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<StepWelcome user={mockUser as any} workflow={mockWorkflow as any} onNext={mockOnNext} />);
    
    expect(screen.getByText(/Glad to have you here,/i)).toBeInTheDocument();
    expect(screen.getByText(/John/i)).toBeInTheDocument();
    expect(screen.getByText(/Engineering/i)).toBeInTheDocument();
  });

  it('should call onNext when clicking the Start Onboarding button', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<StepWelcome user={mockUser as any} workflow={mockWorkflow as any} onNext={mockOnNext} />);
    
    const nextButton = screen.getByRole('button', { name: /Start Onboarding/i });
    fireEvent.click(nextButton);
    
    expect(mockOnNext).toHaveBeenCalled();
  });
});
