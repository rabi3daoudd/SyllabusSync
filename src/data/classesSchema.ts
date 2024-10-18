import { z } from "zod"

export const semesterSchema = z.object({
  name: z.string(),
  start: z.date(),
  end: z.date()
})

export const assignmentSchema = z.object({
  semesterName: z.string(),
  className: z.string(),
  name:z.string(),
  day: z.string(),
  date: z.union([z.date(), z.null(),z.undefined()]).optional(),
  startingTime:z.string(),
  finishingTime:z.string(),
  location:z.string(),
  occurance:z.string()
});

export const classSchema = z.object({
  semesterName: z.string(),
  name: z.string()
})



