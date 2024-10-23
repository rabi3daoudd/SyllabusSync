// classes.test.tsx

import React from 'react';
import { render, screen, act, waitForElementToBeRemoved, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClassPage from '../../app/classes/page.tsx';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc} from 'firebase/firestore';
import { z } from 'zod';
import {semesterSchema } from '../../data/classesSchema.ts';
import { useRouter } from 'next/navigation';

// Mocking external dependencies
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));


const mockUser = { uid: 'test-user-id' };

// Adjusted mockSemesters to use Timestamp for start and end dates
const mockSemesters: z.infer<typeof semesterSchema>[] = [
  {
    name: 'Fall 2024',
    start: new Date("2024-09-06"), // September 6, 2024
    end: new Date("2024-11-06"),  // December 6, 2024
  },
  {
    name: 'Spring 2024',
    start: new Date("2024-01-10"), // January 10, 2024
    end: new Date("2024-04-15"),   // May 15, 2024
  },
];


// Mock scrollTo function
window.scrollTo = jest.fn();

// Mocking firebase-config
jest.mock('../../firebase-config', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }, // Mock authenticated user
  },
  db: jest.fn(), // Mock Firestore database instance
}));

describe('ClassPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Remove this line to see console errors during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders semesters when user is authenticated and semesters are fetched', async () => {
    // Mock onAuthStateChanged to simulate a logged-in user
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser); // Simulate that a user is authenticated
      }, 0);
      return jest.fn();
    });

    // Mock getDoc to simulate fetching Firestore data for semesters
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true, // Simulate document exists
      data: () => ({
        semesters: mockSemesters
      }),
    });

    // Render the ClassPage component
    await act(async () => {
      render(<ClassPage />);
    });

    // Wait for the loading message to disappear before making assertions
    await waitForElementToBeRemoved(() => screen.getByText(/Loading semesters/i));

    // Assert that "Fall 2024" is rendered in the document
    expect(screen.getByText('Fall 2024')).toBeInTheDocument();

    // Assert that "Spring 2024" is rendered in the document
    expect(screen.getByText('Spring 2024')).toBeInTheDocument();
  });

  test('renders loading state initially', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        if (typeof callback === 'function') {
          callback(mockUser);
        }
      }, 0);
      return jest.fn();
    });

    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true });

    await act(async () => {
      render(<ClassPage />);
    });

    expect(await screen.findByText(/Loading semesters/i)).toBeInTheDocument();
  });

  test('redirects to login if no user is authenticated', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        if (typeof callback === 'function') {
          callback(null);
        }
      }, 0);
      return jest.fn();
    });

    await act(async () => {
      render(<ClassPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
