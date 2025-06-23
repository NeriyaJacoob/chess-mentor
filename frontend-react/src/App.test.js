// Basic React test to verify environment
import { render, screen } from '@testing-library/react';

test('renders placeholder text', () => {
  render(<div>Hello Test</div>);
  const text = screen.getByText(/hello test/i);
  expect(text).toBeInTheDocument();
});