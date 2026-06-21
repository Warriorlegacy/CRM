import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotificationBadge from '../components/NotificationBadge';

describe('NotificationBadge Component', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<NotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when count is negative', () => {
    const { container } = render(<NotificationBadge count={-1} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders badge with count', () => {
    render(<NotificationBadge count={5} />);
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('displays 99+ for count over 99', () => {
    render(<NotificationBadge count={100} />);
    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  it('displays 99+ for count of 99', () => {
    render(<NotificationBadge count={99} />);
    const badge = screen.getByText('99');
    expect(badge).toBeInTheDocument();
  });

  it('applies urgent variant styles', () => {
    render(<NotificationBadge count={5} variant="urgent" />);
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('bg-red-600');
    expect(badge).toHaveClass('animate-pulse');
  });

  it('applies default variant styles', () => {
    render(<NotificationBadge count={5} variant="default" />);
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('bg-red-500');
  });
});
