import React from 'react';
import { render, screen, waitFor, act, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClassPage from '../../app/classes/page.tsx';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { assignmentSchema, classSchema, semesterSchema } from '../../data/classesSchema.ts';

// Mocking external dependencies
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

const mockUser = { uid: 'test-user-id' }; // Sample mock data for semesters and classes
const mockSemesters: z.infer<typeof semesterSchema>[] = [
  { name: 'Fall 2024', start: new Date('2024-09-06'), end: new Date('2024-12-06') },
  { name: 'Spring 2024', start: new Date('2024-01-10'), end: new Date('2024-05-15') },
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
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders semesters when user is authenticated and semesters are fetched', async () => {
    // Mocking the onAuthStateChanged function to simulate a logged-in user
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser); // Simulating that a user is authenticated
      }, 0);
      return jest.fn();
    });

    const { auth, db } = jest.requireMock('../../firebase-config');
    console.log("Mocked Firebase Auth:", auth);
    console.log("Mocked Firestore Database (db):", db);

    // Mocking getDoc to simulate fetching Firestore data for semesters and classes
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true, // Simulate document exists
      data: () => ({
        semesters: mockSemesters, // Returning mock semesters
        classes: mockClasses, // Returning mock classes
      }),
    });

    // Render the ClassPage component
    await act(async () => {
      render(<ClassPage />);
    });

    // Debugging the output to verify the component rendering
    console.log("SCREEN DEBUG:");

    // Wait for the loading message to disappear before making assertions
    await waitForElementToBeRemoved(() => screen.getByText(/Loading semesters/i));

    // Output the current DOM to inspect the rendered output
    screen.debug();

    // Assert that "Fall 2024" is rendered in the document
    expect(screen.getByText('Fall 2024')).toBeInTheDocument();

    // Assert that "Spring 2024" is rendered in the document
    expect(screen.getByText('Spring 2024')).toBeInTheDocument();
  });
});
