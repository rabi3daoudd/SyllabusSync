"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SettingsModal, GradeScale } from "./components/settings-modal"

type Course = {
  name: string
  grade: string
  credits: number
}

type CGPAScale = 4 | 10

const defaultGradeScale: GradeScale = {
  "A+": { value: 10, range: "90-100" },
  "A": { value: 9, range: "85-89" },
  "A-": { value: 8, range: "80-84" },
  "B+": { value: 7, range: "75-79" },
  "B": { value: 6, range: "70-74" },
  "C+": { value: 5, range: "65-69" },
  "C": { value: 4, range: "60-64" },
  "D+": { value: 3, range: "55-59" },
  "D": { value: 2, range: "50-54" },
  "E": { value: 1, range: "40-49" },
  "F": { value: 0, range: "0-39" },
}

export default function CGPACalculator() {
  const [currentCGPA, setCurrentCGPA] = useState<number | "">("")
  const [totalCredits, setTotalCredits] = useState<number | "">("")
  const [cgpaScale, setCGPAScale] = useState<CGPAScale>(10)
  const [courses, setCourses] = useState<Course[]>([])
  const [newCourse, setNewCourse] = useState<Course>({ name: "", grade: "A", credits: 0 })
  const [calculatedCGPA, setCalculatedCGPA] = useState<number | null>(null)
  const [calculatedTGPA, setCalculatedTGPA] = useState<number | null>(null)
  const [gradeScale, setGradeScale] = useState<GradeScale>(defaultGradeScale)

  const addCourse = () => {
    if (newCourse.name && newCourse.grade && newCourse.credits) {
      setCourses([...courses, newCourse])
      setNewCourse({ name: "", grade: "A", credits: 0 })
    }
  }

  const calculateGPA = () => {
    if (typeof currentCGPA !== "number" || typeof totalCredits !== "number") {
      alert("Please enter valid current CGPA and total credits")
      return
    }

    // Calculate CGPA
    const totalPoints = currentCGPA * totalCredits
    let newTotalCredits = totalCredits
    let newTotalPoints = totalPoints

    courses.forEach((course) => {
      const gradeValue = gradeScale[course.grade].value
      newTotalPoints += (gradeValue * course.credits * cgpaScale) / 10
      newTotalCredits += course.credits
    })

    const newCGPA = newTotalPoints / newTotalCredits
    setCalculatedCGPA(Number(newCGPA.toFixed(2)))

    // Calculate TGPA
    let termTotalPoints = 0
    let termTotalCredits = 0

    courses.forEach((course) => {
      const gradeValue = gradeScale[course.grade].value
      termTotalPoints += (gradeValue * course.credits * cgpaScale) / 10
      termTotalCredits += course.credits
    })

    const tgpa = termTotalPoints / termTotalCredits
    setCalculatedTGPA(Number(tgpa.toFixed(2)))
  }

  const handleGradeScaleChange = (newGradeScale: GradeScale) => {
    setGradeScale(newGradeScale)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto relative">
      <SettingsModal gradeScale={gradeScale} onSave={handleGradeScaleChange} />
      <CardHeader>
        <CardTitle>CGPA and TGPA Calculator</CardTitle>
        <CardDescription>Calculate your new CGPA and TGPA based on your current grades and new courses.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current-cgpa">Current CGPA</Label>
              <Input
                id="current-cgpa"
                type="number"
                placeholder="e.g., 8.5"
                value={currentCGPA}
                onChange={(e) => setCurrentCGPA(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-credits">Total Credits</Label>
              <Input
                id="total-credits"
                type="number"
                placeholder="e.g., 60"
                value={totalCredits}
                onChange={(e) => setTotalCredits(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cgpa-scale">CGPA Scale</Label>
              <Select value={cgpaScale.toString()} onValueChange={(value) => setCGPAScale(Number(value) as CGPAScale)}>
                <SelectTrigger id="cgpa-scale">
                  <SelectValue placeholder="Select CGPA scale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4.0 Scale</SelectItem>
                  <SelectItem value="10">10.0 Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Add New Course</Label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Input
                placeholder="Course Name"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              />
              <Select
                value={newCourse.grade}
                onValueChange={(value) => setNewCourse({ ...newCourse, grade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(gradeScale).map(([grade, { range }]) => (
                    <SelectItem key={grade} value={grade}>
                      {grade} ({range})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Credits"
                value={newCourse.credits || ""}
                onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
              />
              <Button onClick={addCourse}>Add Course</Button>
            </div>
          </div>
          {courses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow key={index}>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.grade}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button onClick={calculateGPA}>Calculate GPA</Button>
        {calculatedCGPA !== null && (
          <div className="text-lg font-semibold">
            Your new CGPA: {calculatedCGPA} / {cgpaScale}.0
          </div>
        )}
        {calculatedTGPA !== null && (
          <div className="text-lg font-semibold">
            Your TGPA for this term: {calculatedTGPA} / {cgpaScale}.0
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

