// classes.test.tsx

import React from 'react';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClassPage from '../../app/classes/page.tsx';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, updateDoc} from 'firebase/firestore';
import { z } from 'zod';
import {assignmentSchema, classSchema, semesterSchema } from '../../data/classesSchema.ts';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';

beforeAll(() => {
  if (Element.prototype.setPointerCapture === undefined) {
    Element.prototype.setPointerCapture = () => {};
  }
});

// Mocking external dependencies
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));


const mockUser = { uid: 'test-user-id' };

// Adjusted mockSemesters to use Timestamp for start and end dates
const originalMockSemesters: z.infer<typeof semesterSchema>[] = [
  {
    name: 'Fall 2024',
    start: new Date("2024-09-06"),
    end: new Date("2024-11-06"),
  },
  {
    name: 'Spring 2024',
    start: new Date("2024-01-10"),
    end: new Date("2024-04-15"),
  },
];

const originalMockClasses: z.infer<typeof classSchema>[] = [
  {
    semesterName: 'Fall 2024',
    name: 'Biology'
  }
]

const originalMockAssignments: z.infer<typeof assignmentSchema>[] = [
  {
    semesterName: "Fall 2024",
    className: "Biology",
    name: "Lecture",
    day: "Wednesday",
    startingTime:"8:30PM",
    finishingTime:"9:50PM",
    location:"SITE",
    occurance:"OnceAWeek"
  }
]

let mockSemesters: z.infer<typeof semesterSchema>[];
let mockClasses: z.infer<typeof classSchema>[];
let mockAssignments: z.infer<typeof assignmentSchema>[];


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
    mockSemesters = JSON.parse(JSON.stringify(originalMockSemesters));
    mockClasses = JSON.parse(JSON.stringify(originalMockClasses));
    mockAssignments = JSON.parse(JSON.stringify(originalMockAssignments));

  });

  afterEach(() =>{
    cleanup();
  })

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
    await waitFor(() => expect(screen.queryByText(/Loading semesters/i)).not.toBeInTheDocument());

    // Assert that "Fall 2024" is rendered in the document
    expect(screen.getByText('Fall 2024')).toBeInTheDocument();

    // Assert that "Spring 2024" is rendered in the document
    expect(screen.getByText('Spring 2024')).toBeInTheDocument();
  });

  test("renders classes when user is authenticated and classes are fetched", async () => {
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
        semesters: mockSemesters,
        classes: mockClasses
      }),
    });

    // Render the ClassPage component
    await act(async () => {
      render(<ClassPage />);
    });

    // Wait for the loading message to disappear before making assertions
    await waitFor(() => expect(screen.queryByText(/Loading semesters/i)).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryAllByText(/Loading classes/i)).toHaveLength(0));

    // Assert that "Fall 2024" is rendered in the document
    expect(screen.getByText('Fall 2024')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Fall 2024'));

    await waitFor(() => {
      expect(screen.getByText('Biology')).toBeInTheDocument();
    });

  });

  test("renders assignments when user is authenticated and assignments are fetched", async () => {
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
        semesters: mockSemesters,
        classes: mockClasses,
        assignments: mockAssignments
      }),
    });

    // Render the ClassPage component
    await act(async () => {
      render(<ClassPage />);
    });

    // Wait for the loading message to disappear before making assertions
    await waitFor(() => expect(screen.queryByText(/Loading semesters/i)).not.toBeInTheDocument());

    await waitFor(() => expect(screen.queryAllByText(/Loading classes/i)).toHaveLength(0));

    // Assert that "Fall 2024" is rendered in the document
    expect(screen.getByText('Fall 2024')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Fall 2024'));

    await waitFor(() => {
      expect(screen.getByText('Biology')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Biology'));

    await waitFor(() => {
      expect(screen.getByText('Lecture')).toBeInTheDocument();
    });

  });

  test('creates a new semester and adds it to the semester list', async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    // Mock getDoc to return initial semesters
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        semesters: mockSemesters,
        classes: mockClasses,
        assignments: mockAssignments
      }),
    });

    (updateDoc as jest.Mock).mockResolvedValue(Promise.resolve());

    await act(async () => {
      render(<ClassPage />);
    });

    await waitFor(() => expect(screen.queryByText(/Loading semesters/i)).not.toBeInTheDocument());

    await userEvent.click(screen.getByText('+ New Semester'));

    const nameInput = screen.getByPlaceholderText('Enter Semester Name');
    await userEvent.type(nameInput, "TEST SEMESTER");

    await userEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText('TEST SEMESTER')).toBeInTheDocument();
    });

  });

  test('creates a new class and adds it to the correct semester', async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    // Mock getDoc to return initial semesters
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        semesters: mockSemesters,
        classes: mockClasses,
        assignments: mockAssignments

      }),
    });

    (updateDoc as jest.Mock).mockResolvedValue(Promise.resolve());

    await act(async () => {
      render(<ClassPage />);
    });

    await waitFor(() => expect(screen.queryByText(/Loading semesters/i)).not.toBeInTheDocument());

    await waitFor(() => expect(screen.queryAllByText(/Loading classes/i)).toHaveLength(0));

    expect(screen.getByText('Fall 2024')).toBeInTheDocument();

    

    await userEvent.click(screen.getByText('Fall 2024'));
    
    await userEvent.click(screen.getByText('+ Add Class'));

    const nameInput = screen.getByPlaceholderText('Enter Class Name');
    await userEvent.type(nameInput, "TEST CLASS");

    await userEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText('TEST CLASS')).toBeInTheDocument();
    });
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
