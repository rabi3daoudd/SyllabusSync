// __tests__/SignIn.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SignIn } from '@/components/SignIn';
import userEvent from '@testing-library/user-event';

// Mock necessary UI components if they have specific implementations
jest.mock('@/components/ui/input', () => ({
  Input: ({ id, placeholder = '', type = 'text', ...rest }: { id: string; placeholder?: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <input id={id} placeholder={placeholder} type={type} {...rest} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...rest }: { children: React.ReactNode; onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...rest }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardHeader: ({ children, ...rest }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  CardDescription: ({ children, ...rest }: { children: React.ReactNode } & React.HTMLAttributes<HTMLParagraphElement>) => <p {...rest}>{children}</p>,
  CardContent: ({ children, ...rest }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardFooter: ({ children, ...rest }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
}));

describe('SignIn Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the SignIn component with all elements', () => {
    render(<SignIn onSubmit={function (): void {
      throw new Error('Function not implemented.');
    } } onGoogleSignIn={function (): void {
      throw new Error('Function not implemented.');
    } } />);

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByText('Enter your information below to access your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  test('allows user to input username and password', async () => {
    render(<SignIn onSubmit={function (): void {
      throw new Error('Function not implemented.');
    } } onGoogleSignIn={function (): void {
      throw new Error('Function not implemented.');
    } } />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');

    await user.type(usernameInput, 'testuser');
    expect(usernameInput).toHaveValue('testuser');

    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');
  });

  test('calls the onSubmit function when Sign In button is clicked', async () => {
    const mockOnSubmit = jest.fn();

    render(<SignIn onSubmit={mockOnSubmit} onGoogleSignIn={function (): void {
      throw new Error('Function not implemented.');
    } } />);
    const user = userEvent.setup();

    const signInButton = screen.getByRole('button', { name: 'Sign In' });

    await user.click(signInButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  test('calls the onGoogleSignIn function when Sign in with Google button is clicked', async () => {
    const mockGoogleSignIn = jest.fn();

    render(<SignIn onGoogleSignIn={mockGoogleSignIn} onSubmit={function (): void {
      throw new Error('Function not implemented.');
    } } />);
    const user = userEvent.setup();

    const googleSignInButton = screen.getByRole('button', {
      name: 'Sign in with Google',
    });

    await user.click(googleSignInButton);

    expect(mockGoogleSignIn).toHaveBeenCalled();
  });
});
