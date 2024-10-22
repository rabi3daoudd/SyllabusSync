
"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// import { labels } from "../../data/data"
import { taskSchema } from "../../data/schema"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onDelete: (task: TData) => void;
  onEdit: (task: TData) => void;
}

export function DataTableRowActions<TData>({
  row,
  onDelete,
  onEdit,
}: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original) as TData;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(task)}>
          Edit
        </DropdownMenuItem>
        {/* <DropdownMenuItem>Make a copy</DropdownMenuItem> */}
        {/* <DropdownMenuItem>Favorite</DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          {/* <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger> */}
          <DropdownMenuSubContent>
            {/* <DropdownMenuRadioGroup value={task.label}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup> */}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(task)}>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
