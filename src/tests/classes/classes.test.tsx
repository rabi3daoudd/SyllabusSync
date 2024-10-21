import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClassPage from '../../app/classes/page.tsx';
import { onAuthStateChanged } from 'firebase/auth';
import {getDoc} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// Mock Firebase imports
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

const mockUser = { uid: 'test-user-id' };

// Mocking scrollTo since jsdom does not implement it
window.scrollTo = jest.fn();

// Mock auth object
jest.mock('../../firebase-config', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
  db: jest.fn(),
}));

describe('ClassPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders loading state initially', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => {
        if (typeof callback === 'function') {
          callback(mockUser);
        }
      }, 0);
      return jest.fn();
    });

    getDoc.mockResolvedValueOnce({ exists: () => true });

    await act(async () => {
      render(<ClassPage />);
    });

    expect(await screen.findByText(/Loading semesters/i)).toBeInTheDocument();
  });

  test('redirects to login if no user is authenticated', async () => {
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });

    onAuthStateChanged.mockImplementation((auth, callback) => {
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
