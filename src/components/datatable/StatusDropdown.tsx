import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Task } from '../../data/schema';

interface StatusDropdownProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

const statuses = [
  { value: 'todo', label: 'To Do' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export const StatusDropdown: React.FC<StatusDropdownProps> = ({ task, onStatusChange }) => {
  const currentStatus = statuses.find((s) => s.value === task.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-100 focus:ring focus:ring-blue-500"
        >
          {currentStatus ? currentStatus.label : 'Unknown'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statuses.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => onStatusChange(task.id, status.value)}
          >
            {status.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
