import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ClassPage from '../../pages/classes';

describe('ClassPage Component Tests', () => {

  beforeEach(() => {
    window.scrollTo = jest.fn();
    Element.prototype.setPointerCapture = jest.fn();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks(); 
  });

  test('Component renders correctly', () => {
    render(<ClassPage />);
    expect(screen.getByText(/Create Semester/i)).toBeInTheDocument();
  });

  test('Adding a semester', async () => {
    render(<ClassPage />);
    await userEvent.click(screen.getByText(/Create Semester/i));

    const semesterNameInput = await screen.getByPlaceholderText(/Enter Semester Name/i);
    await userEvent.type(semesterNameInput, 'Fall Semester 2024');

    const submitButton = await screen.findByText(/Submit/i);
    await userEvent.click(submitButton);

    await waitFor(() => expect(screen.getByText('Fall Semester 2024')).toBeInTheDocument());

  });

  test('Adding a class', async () => {
    render(<ClassPage />);

    await userEvent.click(screen.getByText(/Create Semester/i));

    const semesterNameInput = await screen.findByPlaceholderText(/Enter Semester Name/i);
    await userEvent.type(semesterNameInput, 'Fall Semester 2024');

    const submitButton = await screen.findByText(/Submit/i);
    await userEvent.click(submitButton);


    await waitFor(() => {
      const semesterButton = screen.getByText('Fall Semester 2024');

      const isInteractable = !semesterButton.closest('[style*="pointer-events: none"]');
      if (!isInteractable) {
          throw new Error('Element is not yet interactable');
      }
    });


    await userEvent.click(screen.getByText('Fall Semester 2024'));

    const addClassButton = await screen.findByText(/\+ Add Class/i);
    await userEvent.click(addClassButton);

    const classNameInput = await screen.findByPlaceholderText(/Enter Class Name/i);
    await userEvent.type(classNameInput, 'Test Class');

    const submitClassButton = await screen.findByText(/Submit/i);
    await userEvent.click(submitClassButton);

    await waitFor(() => expect(screen.getByText('Test Class')).toBeInTheDocument());
  });

  test('Validation and Error Handling for class', async () => {
    render(<ClassPage />);

    await userEvent.click(screen.getByText(/Create Semester/i));

    const semesterNameInput = await screen.findByPlaceholderText(/Enter Semester Name/i);
    await userEvent.type(semesterNameInput, 'Fall Semester 2024');

    const submitButton = await screen.findByText(/Submit/i);
    await userEvent.click(submitButton);


    await waitFor(() => {
      const semesterButton = screen.getByText('Fall Semester 2024');

      const isInteractable = !semesterButton.closest('[style*="pointer-events: none"]');
      if (!isInteractable) {
          throw new Error('Element is not yet interactable');
      }
    });

    await userEvent.click(screen.getByText('Fall Semester 2024'));

    const addClassButton = await screen.findByText(/\+ Add Class/i);
    await userEvent.click(addClassButton);

    const submitClassButton = await screen.findByText(/Submit/i);
    await userEvent.click(submitClassButton);

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await waitFor(() => expect(alertMock).toHaveBeenCalledWith("Please fill in all fields."));

    alertMock.mockRestore();


  });

  test('Validation and Error Handling for semester', async () => {
    render(<ClassPage />);

    await userEvent.click(screen.getByText(/Create Semester/i));

    const submitButton = await screen.findByText(/Submit/i);
    await userEvent.click(submitButton);

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await waitFor(() => expect(alertMock).toHaveBeenCalledWith("Please fill in all fields."));

    alertMock.mockRestore();
  });


});