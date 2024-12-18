import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  priority: z.string(),
  label: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export type Task = z.infer<typeof taskSchema>