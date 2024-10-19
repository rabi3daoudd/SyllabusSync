"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

// import { labels, priorities, statuses } from "../../data/data"
import { Task } from "../../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { StatusDropdown } from "./StatusDropdown";

// interface ColumnsProps {
//   userClasses: string[];
//   onDelete: (task: Task) => void
// }

export const columns = (
  userClasses: string[],
  onDelete: (task: Task) => void,
  onEdit: (task: Task) => void,
  onStatusChange: (taskId: string, newStatus: string) => void,

): ColumnDef<Task>[] => [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && "indeterminate")
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Task" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const dueDateString = row.getValue("dueDate") as string | null;
  
      if (!dueDateString) {
        // Display "No Due Date Selected" when dueDate is not set
        return <span className="text-gray-500 italic">Unavailable </span>;
      }
  
      const dueDate = new Date(dueDateString);
      console.log(userClasses)
      const formattedDate = dueDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
  
      // Optional: Highlight overdue tasks
      const today = new Date();
      const isOverdue = dueDate < today && row.original.status !== "done";
  
      return (
        <span style={{ color: isOverdue ? "red" : "inherit" }}>
          {formattedDate}
        </span>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const className = row.original.label;

      return (
        <div className="flex items-start space-x-2">
          {className ? (
            <Badge variant="outline">{className}</Badge>
          ) : null}
          <span className="font-medium leading-tight">
            {row.getValue("title")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const task = row.original;
      return (
        <StatusDropdown task={task} onStatusChange={onStatusChange} />
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priorities = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ]
      const priorityValue = row.getValue("priority") as string
      const priority = priorities.find((p) => p.value === priorityValue)

      if (!priority) {
        return null
      }

      return (
        <div className="flex items-center">
          {/* Add icon if available */}
          <span>{priority.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions row={row} onDelete={onDelete} onEdit={onEdit} />
    ),
  },
]