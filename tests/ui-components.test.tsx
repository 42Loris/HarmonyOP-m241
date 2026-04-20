import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { Inbox } from 'lucide-react';
import React from 'react';

describe('UI Components', () => {
  describe('Skeleton', () => {
    it('should render with animate-pulse class', () => {
      const { container } = render(<Skeleton className="h-4 w-4" />);
      expect(container.firstChild).toHaveClass('animate-pulse');
      expect(container.firstChild).toHaveClass('h-4');
    });
  });

  describe('EmptyState', () => {
    it('should render the title and description', () => {
      render(
        <EmptyState 
          icon={Inbox} 
          title="No Data" 
          description="Please check back later." 
        />
      );
      
      expect(screen.getByText('No Data')).toBeInTheDocument();
      expect(screen.getByText('Please check back later.')).toBeInTheDocument();
    });

    it('should render an action button if provided', () => {
      render(
        <EmptyState 
          icon={Inbox} 
          title="No Data" 
          description="Check back later." 
          action={{ label: 'Go Home', href: '/' }}
        />
      );
      
      const button = screen.getByRole('link', { name: /go home/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/');
    });
  });
});