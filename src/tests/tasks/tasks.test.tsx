import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import TaskPage from "../../app/tasks/page.tsx";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { taskSchema } from "../../data/schema";
import * as CreateTaskModule from "@/components/CreateTask";
import * as DataTableModule from "@/components/datatable/data-table";

jest.mock("firebase/auth");
jest.mock("firebase/firestore");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

const mockUser = { uid: "test-user-id" };
const mockTasks: z.infer<typeof taskSchema>[] = [
  {
    id: "TASK-1",
    title: "Test Task 1",
    status: "todo",
    priority: "medium",
  },
  {
    id: "TASK-2",
    title: "Test Task 2",
    status: "in progress",
    priority: "high",
  },
];

window.scrollTo = jest.fn();

jest.mock("../../firebase-config", () => ({
  auth: {
    currentUser: { uid: "test-user-id" },
  },
  db: jest.fn(),
}));
jest.mock("@/components/datatable/data-table", () => ({
  DataTable: ({ data }: { data: z.infer<typeof taskSchema>[] }) => (
    <div>
      {data.map((task) => (
        <div key={task.id}>
          <span>{task.title}</span>
        </div>
      ))}
    </div>
  ),
}));

describe("TaskPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  test("renders loading state initially", async () => {
    // Mock onAuthStateChanged to simulate user authentication
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    // Mock getDoc to return an empty tasks array
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ tasks: [] }),
    });

    await act(async () => {
      render(<TaskPage />);
    });

    expect(screen.getByText(/Loading tasks/i)).toBeInTheDocument();
  });

  test("redirects to login if no user is authenticated", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(null);
      }, 0);
      return jest.fn();
    });

    await act(async () => {
      render(<TaskPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  test("renders tasks when user is authenticated and tasks are fetched", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        tasks: mockTasks,
        classes: [],
      }),
    });

    await act(async () => {
      render(<TaskPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Welcome back!")).toBeInTheDocument();
      expect(
        screen.getByText("Here's a list of your tasks!")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    expect(screen.getByText("Test Task 2")).toBeInTheDocument();
  });
  test("creates a new task and adds it to the task list", async () => {
    const createTaskSpy = jest
      .spyOn(CreateTaskModule, "CreateTask")
      .mockImplementation(({ onNewTask }) => {
        onNewTask({
          id: "TASK-3",
          title: "New Test Task",
          status: "todo",
          priority: "low",
        });
        return null;
      });
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        tasks: mockTasks,
        classes: [],
      }),
    });

    (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);

    await act(async () => {
      render(<TaskPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Welcome back!")).toBeInTheDocument();
    });

    // Wait for the new task to be added to the list
    await waitFor(() => {
      expect(screen.getByText("New Test Task")).toBeInTheDocument();
    });

    // Verify that updateDoc was called with the correct data
    expect(updateDoc).toHaveBeenCalled();
    const updateDocCalls = (updateDoc as jest.Mock).mock.calls;
    const lastCall = updateDocCalls[updateDocCalls.length - 1];
    const [, data] = lastCall;

    expect(data.tasks).toContainEqual({
      id: "TASK-3",
      title: "New Test Task",
      status: "todo",
      priority: "low",
    });

    createTaskSpy.mockRestore();
  });

  test("deletes a task and removes it from the task list", async () => {
    const dataTableSpy = jest
      .spyOn(DataTableModule, "DataTable")
      .mockImplementation(({ onDelete }) => {
        // Simulate deleting the first task
        onDelete(mockTasks[0]);
        return <></>;
      });

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        tasks: mockTasks,
        classes: [],
      }),
    });

    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(<TaskPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Welcome back!")).toBeInTheDocument();
    });

    const updateDocCalls = (updateDoc as jest.Mock).mock.calls;

    const lastCall = updateDocCalls[updateDocCalls.length - 1];
    expect(lastCall).toBeDefined();

    const [docRef, data] = lastCall;

    console.log(docRef);

    expect(data).toEqual({
      tasks: [
        {
          id: "TASK-2",
          title: "Test Task 2",
          status: "in progress",
          priority: "high",
        },
      ],
    });

    dataTableSpy.mockRestore();
  });

  test("updates task status when status is changed", async () => {
    // Spy on DataTable and mock implementation
    const dataTableSpy = jest
      .spyOn(DataTableModule, "DataTable")
      .mockImplementation(({ onStatusChange }) => {
        // Simulate changing status of the first task to 'completed'
        onStatusChange(mockTasks[0].id, "completed");
        return <></>;
      });

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        tasks: mockTasks,
        classes: [],
      }),
    });

    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(<TaskPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Welcome back!")).toBeInTheDocument();
    });

    const updateDocCalls = (updateDoc as jest.Mock).mock.calls;
    const lastCall = updateDocCalls[updateDocCalls.length - 1];
    expect(lastCall).toBeDefined();
    const [docRef, data] = lastCall;
    console.log(docRef);

    expect(data).toEqual({
      tasks: [
        {
          id: "TASK-1",
          title: "Test Task 1",
          status: "completed",
          priority: "medium",
        },
        {
          id: "TASK-2",
          title: "Test Task 2",
          status: "in progress",
          priority: "high",
        },
      ],
    });

    dataTableSpy.mockRestore();
  });

  test("updates a task when it is edited", async () => {

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        tasks: [
          {
            id: "TASK-1",
            title: "Test Task 1",
            status: "todo",
            priority: "low",
          },
        ],
        classes: [],
      }),
    });

    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(<TaskPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    });

    // Simulate editing the task
    const dataTableSpy = jest
      .spyOn(DataTableModule, "DataTable")
      .mockImplementation(({ onEdit, data }) => {
        // Simulate clicking the edit button
        onEdit({
          id: "TASK-1",
          title: "Updated Test Task 1",
          status: "in progress",
          priority: "high",
        });
        return (
          <div>
            {data.map((task: { id: string; title: string }) => (
              <div key={task.id}>
                <span>{task.title}</span>
              </div>
            ))}
          </div>
        );
      });

    // Wait for the updated task to appear
    await waitFor(() => {
      expect(screen.getByText("Updated Test Task 1")).toBeInTheDocument();
    });

    // Verify that updateDoc was called with the correct data
    const updateDocCalls = (updateDoc as jest.Mock).mock.calls;
    const lastCall = updateDocCalls[updateDocCalls.length - 1];
    const [, data] = lastCall;

    expect(data.tasks).toContainEqual({
      id: "TASK-1",
      title: "Updated Test Task 1",
      status: "in progress",
      priority: "high",
    });

    dataTableSpy.mockRestore();
  });

  test("renders error state when fetching tasks fails", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    // Mock getDoc to reject with an error
    (getDoc as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to fetch tasks")
    );

    await act(async () => {
      render(<TaskPage />);
    });

    // Wait for the error state to be rendered
    await waitFor(() => {
      expect(screen.getByText("Failed to load tasks")).toBeInTheDocument();
    });
  });
});
