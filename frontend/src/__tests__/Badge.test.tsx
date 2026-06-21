import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from '../components/Badge';

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge text="New" />);
    const badge = screen.getByText('New');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('border-zinc-700');
  });

  it('renders with success variant', () => {
    render(<Badge text="Won" variant="success" />);
    const badge = screen.getByText('Won');
    expect(badge).toHaveClass('border-green-800');
  });

  it('renders with warning variant', () => {
    render(<Badge text="Follow-up" variant="warning" />);
    const badge = screen.getByText('Follow-up');
    expect(badge).toHaveClass('border-yellow-800');
  });

  it('renders with danger variant', () => {
    render(<Badge text="Lost" variant="danger" />);
    const badge = screen.getByText('Lost');
    expect(badge).toHaveClass('border-red-800');
  });

  it('applies correct CSS classes for each variant', () => {
    const { rerender } = render(<Badge text="Test" variant="default" />);
    expect(screen.getByText('Test')).toHaveClass('bg-zinc-900');

    rerender(<Badge text="Test" variant="success" />);
    expect(screen.getByText('Test')).toHaveClass('bg-green-900/30');

    rerender(<Badge text="Test" variant="warning" />);
    expect(screen.getByText('Test')).toHaveClass('bg-yellow-900/30');

    rerender(<Badge text="Test" variant="danger" />);
    expect(screen.getByText('Test')).toHaveClass('bg-red-900/30');
  });
});
