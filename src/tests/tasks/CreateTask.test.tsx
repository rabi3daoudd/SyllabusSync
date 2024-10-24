import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateTask } from '../../components/CreateTask';
import { getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// Mock Firebase functions
jest.mock('../../firebase-config', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  doc: jest.fn(),
}));

// Mock external components
jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerClose: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'submit' | 'reset' | 'button';
  }) => (
    <button onClick={onClick} type={type}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (date: Date | null) => void }) => (
    <div>
      <button onClick={() => onSelect(new Date('2023-10-10T00:00:00.000Z'))}>Select Date</button>
    </div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.join(' '),
}));

// // Mock date formatting
// jest.mock('date-fns', () => ({
//   format: () => '2023-10-10',
// }));

const mockUserClasses = ['Math', 'Science', 'History'];

describe('CreateTask Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly in create mode', () => {
    render(
      <CreateTask
        onNewTask={jest.fn()}
        onUpdateTask={jest.fn()}
        userClasses={mockUserClasses}
        mode="create"
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Enter the Task Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Task Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Label')).toBeInTheDocument();
    expect(screen.getByText('Create Task')).toBeInTheDocument();
  });

  test('renders correctly in edit mode', () => {
    const task = {
      id: 'TASK-1',
      title: 'Test Task',
      status: 'in progress',
      priority: 'high',
      label: 'Math',
      dueDate: '2023-10-10T00:00:00.000Z',
    };

    render(
      <CreateTask
        onNewTask={jest.fn()}
        onUpdateTask={jest.fn()}
        userClasses={mockUserClasses}
        task={task}
        mode="edit"
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toHaveValue('in progress');
    expect(screen.getByLabelText('Priority')).toHaveValue('high');
    expect(screen.getByLabelText('Label')).toHaveValue('Math');
    expect(screen.getByText('Save')).toBeInTheDocument();
  });


  test('submits form and calls onNewTask in create mode', async () => {
    const mockOnNewTask = jest.fn();
    const mockOnClose = jest.fn();

    // Mock Firebase functions
    const mockUpdateDoc = updateDoc as jest.Mock;
    const mockArrayUnion = arrayUnion as jest.Mock;
    const mockGetDoc = getDoc as jest.Mock;

    mockUpdateDoc.mockResolvedValue(undefined);
    mockArrayUnion.mockImplementation((task) => task);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        tasks: [],
      }),
    });

    render(
      <CreateTask
        onNewTask={mockOnNewTask}
        onUpdateTask={jest.fn()}
        userClasses={mockUserClasses}
        mode="create"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Task Title'), {
      target: { value: 'New Task' },
    });
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'todo' },
    });
    fireEvent.change(screen.getByLabelText('Priority'), {
      target: { value: 'medium' },
    });
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Science' },
    });

    // Simulate due date selection
    fireEvent.click(screen.getByText('Select a due date')); // Open the date picker
    fireEvent.click(screen.getByText('Select Date')); // Select the date

    // Wait for the due date to be updated in the UI
    await waitFor(() => {
      const textContent = screen.queryByText('2023-10-09') || screen.queryByText('2023-10-10');
      expect(textContent).toBeInTheDocument();
    });
    

    // Submit the form
    fireEvent.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(mockOnNewTask).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    const newTask = mockOnNewTask.mock.calls[0][0];
    expect(newTask).toMatchObject({
      id: 'TASK-1', 
      title: 'New Task',
      status: 'todo',
      priority: 'medium',
      label: 'Science',
    });
  });

  test('submits form and calls onUpdateTask in edit mode', async () => {
    const mockOnUpdateTask = jest.fn();
    const mockOnClose = jest.fn();

    const mockUpdateDoc = updateDoc as jest.Mock;
    const mockGetDoc = getDoc as jest.Mock;

    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        tasks: [
          {
            id: 'TASK-1',
            title: 'Old Task',
            status: 'todo',
            priority: 'low',
          },
        ],
      }),
    });

    const task = {
      id: 'TASK-1',
      title: 'Old Task',
      status: 'todo',
      priority: 'low',
    };

    render(
      <CreateTask
        onNewTask={jest.fn()}
        onUpdateTask={mockOnUpdateTask}
        userClasses={mockUserClasses}
        task={task}
        mode="edit"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Update the form fields
    fireEvent.change(screen.getByLabelText('Task Title'), {
      target: { value: 'Updated Task' },
    });
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'in progress' },
    });
    fireEvent.change(screen.getByLabelText('Priority'), {
      target: { value: 'high' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnUpdateTask).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    const updatedTask = mockOnUpdateTask.mock.calls[0][0];
    expect(updatedTask).toMatchObject({
      id: 'TASK-1',
      title: 'Updated Task',
      status: 'in progress',
      priority: 'high',
    });
  });

  test('handles validation errors', async () => {
    const mockOnNewTask = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <CreateTask
        onNewTask={mockOnNewTask}
        onUpdateTask={jest.fn()}
        userClasses={mockUserClasses}
        mode="create"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Submit the form without filling required fields
    fireEvent.click(screen.getByText('Create Task'));

    // Check that onNewTask was not called
    await waitFor(() => {
      expect(mockOnNewTask).not.toHaveBeenCalled();
    });

    // Optionally, check for validation messages if your form displays them
  });
});
