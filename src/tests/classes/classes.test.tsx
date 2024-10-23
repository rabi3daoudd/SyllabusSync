// classes.test.tsx

import React from 'react';
import { render, screen, waitFor, act, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClassPage from '../../app/classes/page.tsx';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import { assignmentSchema, classSchema, semesterSchema } from '../../data/classesSchema.ts';

// Mocking external dependencies
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

// Mocking SemesterComponent to simplify the test
jest.mock('@/components/classComponents/semester-component', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div>{name}</div>,
}));

const mockUser = { uid: 'test-user-id' };

// Adjusted mockSemesters to use Timestamp for start and end dates
const mockSemestersData = [
  {
    name: 'Fall 2024',
    start: new Date(2024, 8, 6), // September 6, 2024
    end: new Date(2024, 11, 6),  // December 6, 2024
  },
  {
    name: 'Spring 2024',
    start: new Date(2024, 0, 10), // January 10, 2024
    end: new Date(2024, 4, 15),   // May 15, 2024
  },
];

const mockClasses: z.infer<typeof classSchema>[] = [
  { semesterName: 'Fall 2024', name: 'Biology' },
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
    // jest.spyOn(console, 'error').mockImplementation(() => {});
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
        semesters: mockSemestersData, // Returning mock semesters with Timestamps
        classes: mockClasses,         // Returning mock classes
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
});
