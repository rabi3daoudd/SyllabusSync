import React, { ComponentProps, PropsWithChildren } from 'react';
import { fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, updateDoc } from 'firebase/firestore';
import ChatBot from '@/components/assistant/Chat';
import userEvent from '@testing-library/user-event';
import { useChat } from 'ai/react';
import { findOrCreateSyallbusSyncCalendar } from '@/components/FindOrCreateSyallbusSyncCalendar';

beforeAll(() => {
    if (Element.prototype.setPointerCapture === undefined) {
      Element.prototype.setPointerCapture = () => {};
    }
});

jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

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
  jest.mock('lucide-react', () => ({
    Send: () => <svg data-testid="send-icon" />,
    Loader2: () => <svg data-testid="loader-icon" />,
    Sun: () => <div data-testid="mock-sun-icon" />,
    Moon: () => <div data-testid="mock-moon-icon" />,
  }));

const mockUser = { uid: 'test-user-id' };
const mockCalendarId = 'calendar-123';
const mockMessages = [
{ id: '1', role: 'user', content: 'Hello' },
{ id: '2', role: 'assistant', content: 'Hi there! How can I assist you today?' },
];

window.scrollTo = jest.fn();

jest.mock('../../firebase-config', () => ({
    auth: {
      currentUser: { uid: 'test-user-id' }, // Mock authenticated user
    },
    db: jest.fn(), // Mock Firestore database instance
  }));

  describe('ChatBot Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    test('toggles from light to dark mode', async () => {

        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            setTimeout(() => {
                callback(mockUser);
            }, 0);
            return jest.fn();
            });

        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => ({
            theme: "light"
    
            }),
        });

        (findOrCreateSyallbusSyncCalendar as jest.Mock).mockResolvedValue(mockCalendarId);

        // Mock useChat hook
        (useChat as jest.Mock).mockReturnValue({
        messages: mockMessages,
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
        });
    
        (updateDoc as jest.Mock).mockResolvedValue(Promise.resolve());

        render(<ChatBot />);

        await waitFor(() => {
        expect(screen.getByText(/dark mode/i)).toBeInTheDocument();
        });

        await userEvent.click(screen.getByText(/dark mode/i));

        await waitFor(() => {
        expect(screen.getByText(/light mode/i)).toBeInTheDocument();
        });
    
    })
    test('toggles from dark to light mode', async () => {

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
          setTimeout(() => {
              callback(mockUser);
          }, 0);
          return jest.fn();
          });

      (getDoc as jest.Mock).mockResolvedValue({
          exists: () => true,
          data: () => ({
          theme: "dark"
  
          }),
      });

      (findOrCreateSyallbusSyncCalendar as jest.Mock).mockResolvedValue(mockCalendarId);

      (useChat as jest.Mock).mockReturnValue({
      messages: mockMessages,
      input: '',
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      isLoading: false,
      });
  
      (updateDoc as jest.Mock).mockResolvedValue(Promise.resolve());

      render(<ChatBot />);

      await waitFor(() => {
      expect(screen.getByText(/light mode/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/light mode/i));

      await waitFor(() => {
      expect(screen.getByText(/dark mode/i)).toBeInTheDocument();
      });
  
    })
    test("Change the color of the assistant text color", async () => {

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        setTimeout(() => {
          callback(mockUser);
        }, 0);
        return jest.fn();
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          theme: "dark",
          assistantTextColor: "#00f51d"
        }),
      });
    
      (findOrCreateSyallbusSyncCalendar as jest.Mock).mockResolvedValue(mockCalendarId);
    
      // Mock useChat hook
      (useChat as jest.Mock).mockReturnValue({
        messages: mockMessages,
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
      });

      (updateDoc as jest.Mock).mockResolvedValue(Promise.resolve());

      render(<ChatBot />);

      await waitFor(() => {
        expect(screen.getByText(/Assistant Text Color:/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/Assistant Text Color:/i));

      const colorInput = document.querySelector('input[type="color"]') as HTMLInputElement;
      expect(colorInput).toBeInTheDocument();

      await userEvent.click(colorInput);

      fireEvent.change(colorInput, { target: { value: '#ff5733' } });

      await waitFor(() => {
        expect(colorInput.value).toBe('#ff5733');
      })

    });
    test("Change the background color", async () => {

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        setTimeout(() => {
          callback(mockUser);
        }, 0);
        return jest.fn();
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          theme: "dark",
          assistantTextColor: "#00f51d",
          backgroundColor: "#fb00ff"
        }),
      });
    
      (findOrCreateSyallbusSyncCalendar as jest.Mock).mockResolvedValue(mockCalendarId);
    
      // Mock useChat hook
      (useChat as jest.Mock).mockReturnValue({
        messages: mockMessages,
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
      });
    
      // Mock updateDoc to resolve immediately and simulate a successful state update in the component
      (updateDoc as jest.Mock).mockResolvedValue(Promise.resolve());
    
      // Render the component
      render(<ChatBot />);
    
      // Wait for the "Assistant Text Color" label to appear
      await waitFor(() => {
        expect(screen.getByText(/Background Color:/i)).toBeInTheDocument();
      });
    
      // Click on the "Assistant Text Color" label to focus the input
      await userEvent.click(screen.getByText(/Background Color:/i));
    
      // Manually select the color input using querySelector with the initial color value
      const colorInput = document.querySelector('input[type="color"]') as HTMLInputElement;
      expect(colorInput).toBeInTheDocument();

      await userEvent.click(colorInput);

      // Simulate changing the color input's value programmatically (since color picker UI cannot be interacted with in a test)
      fireEvent.change(colorInput, { target: { value: '#ff5733' } });

      await waitFor(() => {
        expect(colorInput.value).toBe('#ff5733');
      })

    });
  });