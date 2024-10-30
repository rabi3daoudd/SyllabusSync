// src/tests/chat/chatbot.test.tsx

import React, { PropsWithChildren, ComponentProps } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatBot from '@/components/assistant/Chat';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { findOrCreateSyallbusSyncCalendar } from '@/components/FindOrCreateSyallbusSyncCalendar';
import { useChat } from 'ai/react';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  // Add other Firebase Auth functions if needed
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  // Add other Firestore functions if needed
}));

// Mock Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  // Add other Storage functions if needed
}));

// Mock the findOrCreateSyallbusSyncCalendar function
jest.mock('@/components/FindOrCreateSyallbusSyncCalendar', () => ({
  findOrCreateSyallbusSyncCalendar: jest.fn(),
}));

// Mock the useChat hook from 'ai/react'
jest.mock('ai/react', () => ({
  useChat: jest.fn(),
}));

// Define types for mock components
interface ReactMarkdownProps {
  children: string;
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: string;
  size?: string;
}

interface InputProps extends ComponentProps<'input'> {
  variant?: string;
}

interface CardProps extends PropsWithChildren {
  className?: string;
}

// Mock ReactMarkdown with proper typing
jest.mock('react-markdown', () => (props: ReactMarkdownProps) => <div>{props.children}</div>);

// Mock UI Components with proper typing
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: ButtonProps) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: InputProps) => <input {...props} />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: CardProps) => <div className={className}>{children}</div>,
  CardContent: ({ children }: PropsWithChildren) => <div>{children}</div>,
  CardFooter: ({ children }: PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

// Mock Lucide Icons
// Mock Lucide Icons
jest.mock('lucide-react', () => ({
  Send: () => <svg data-testid="send-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
  Globe: () => <svg data-testid="globe-icon" />,
}));

// Mock the Select components with proper typing
jest.mock('@/components/ui/select', () => {
  const React = require('react');
  return {
    Select: ({ children }) => <div>{children}</div>,
    SelectTrigger: React.forwardRef(({ children }, ref) => <div ref={ref}>{children}</div>),
    SelectValue: React.forwardRef(({ children, placeholder }, ref) => (
        <span ref={ref}>{children || placeholder}</span>
    )),
    SelectContent: React.forwardRef(({ children }, ref) => <div ref={ref}>{children}</div>),
    SelectItem: React.forwardRef(({ children, value }, ref) => (
        <div ref={ref} data-value={value}>
          {children}
        </div>
    )),
  };
});


// Mock Radix UI Slot component
jest.mock('@radix-ui/react-slot', () => {
  const React = require('react');
  return {
    Slot: React.forwardRef(({ children }, ref) => <>{children}</>),
  };
});


describe('ChatBot Component', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockCalendarId = 'calendar-123';
  const mockMessages = [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi there! How can I assist you today?' },
  ];

  // Create mock implementations for Firebase Auth, Firestore, and Storage
  const mockAuthInstance = {
    currentUser: { uid: 'test-user-id' },
    // Add other auth methods if used
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getAuth to return mockAuthInstance
    (getAuth as jest.Mock).mockReturnValue(mockAuthInstance);

    // Mock onAuthStateChanged to immediately call the callback with a user
    (onAuthStateChanged as jest.Mock).mockImplementation((_authInstance, callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });

    // Mock findOrCreateSyallbusSyncCalendar to resolve with mockCalendarId
    (findOrCreateSyallbusSyncCalendar as jest.Mock).mockResolvedValue(mockCalendarId);

    // Mock useChat hook
    (useChat as jest.Mock).mockReturnValue({
      messages: mockMessages,
      input: '',
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      isLoading: false,
    });
  });

  test('renders nothing if user is not authenticated', async () => {
    // Override the onAuthStateChanged mock to simulate no user
    (onAuthStateChanged as jest.Mock).mockImplementation((_authInstance, callback) => {
      callback(null);
      return jest.fn();
    });

    render(<ChatBot />);

    // Since the component returns null, nothing should be in the document
    expect(screen.queryByText(/SyllabusSync Assistant/i)).not.toBeInTheDocument();
  });

  test('renders ChatBot interface when user is authenticated', async () => {
    render(<ChatBot />);

    // Wait for the component to finish initial rendering
    await waitFor(() => {
      expect(screen.getByText('SyllabusSync Assistant')).toBeInTheDocument();
    });

    // Check if messages are rendered
    expect(screen.getByText('You:')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('SyllabusSync:')).toBeInTheDocument();
    expect(screen.getByText('Hi there! How can I assist you today?')).toBeInTheDocument();

    // Check if input and send button are present
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  test('fetches and sets calendarId on mount', async () => {
    render(<ChatBot />);

    await waitFor(() => {
      expect(findOrCreateSyallbusSyncCalendar).toHaveBeenCalledTimes(1);
    });
  });

  test('handles form submission', async () => {
    const mockHandleSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
    (useChat as jest.Mock).mockReturnValue({
      messages: mockMessages,
      input: 'New message',
      handleInputChange: jest.fn(),
      handleSubmit: mockHandleSubmit,
      isLoading: false,
    });

    render(<ChatBot />);

    const form = screen.getByTestId('chat-form');
    fireEvent.submit(form);

    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  test('displays loading state when sending message', async () => {
    (useChat as jest.Mock).mockReturnValue({
      messages: mockMessages,
      input: '',
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      isLoading: true,
    });

    render(<ChatBot />);

    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.getByText('Sending')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  test('displays extracted calendar information when available', async () => {
    const extractedContent = '<calendar_api_call>{"event": "Meeting"}</calendar_api_call>';
    const messagesWithExtraction = [
      ...mockMessages,
      { id: '3', role: 'assistant', content: extractedContent },
    ];

    (useChat as jest.Mock).mockReturnValue({
      messages: messagesWithExtraction,
      input: '',
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      isLoading: false,
    });

    render(<ChatBot />);

    await waitFor(() => {
      expect(screen.getByText('Extracted Calendar Information:')).toBeInTheDocument();
      expect(screen.getByText('{"event": "Meeting"}')).toBeInTheDocument();
    });
  });

  test('does not display extracted information if not present', async () => {
    render(<ChatBot />);

    await waitFor(() => {
      expect(screen.queryByText('Extracted Calendar Information:')).not.toBeInTheDocument();
    });
  });

  test('handles errors when initializing calendar', async () => {
    (findOrCreateSyallbusSyncCalendar as jest.Mock).mockRejectedValueOnce(new Error('Calendar init failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ChatBot />);

    await waitFor(() => {
      expect(findOrCreateSyallbusSyncCalendar).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error initializing calendar:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});