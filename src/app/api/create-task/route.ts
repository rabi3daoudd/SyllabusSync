import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import type { Transaction } from 'firebase-admin/firestore';

interface Task {
  id: string;
  title: string;
  status: "todo" | "in progress" | "done";
  priority: "low" | "medium" | "high";
  label?: string;
  dueDate?: string;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const uid = authHeader.split("Bearer ")[1];

    const taskData = await request.json();
    
    const result = await db.runTransaction(async (transaction: Transaction) => {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User document not found");
      }

      const userData = userDoc.data();
      const existingTasks = userData?.tasks || [];

      // Find the highest task ID number
      const highestId = existingTasks.reduce((maxId: number, task: Task) => {
        const taskIdNumber = parseInt(task.id.replace('TASK-', ''));
        return taskIdNumber > maxId ? taskIdNumber : maxId;
      }, 0);

      const taskId = `TASK-${highestId + 1}`;
      const task = { ...taskData, id: taskId } as Task;
      
      transaction.update(userRef, {
        tasks: [...existingTasks, task]
      });

      return { taskId: task.id };
    });

    return NextResponse.json({ success: true, taskId: result.taskId });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 