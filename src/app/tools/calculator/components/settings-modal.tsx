import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings } from 'lucide-react'

export type GradeScale = {
  [key: string]: { value: number; range: string }
}

type SettingsModalProps = {
  gradeScale: GradeScale
  onSave: (newGradeScale: GradeScale) => void
}

export function SettingsModal({ gradeScale, onSave }: SettingsModalProps) {
  const [localGradeScale, setLocalGradeScale] = useState<GradeScale>(gradeScale)

  const handleChange = (grade: string, field: "value" | "range", value: string) => {
    setLocalGradeScale((prev) => ({
      ...prev,
      [grade]: { ...prev[grade], [field]: field === "value" ? Number(value) : value },
    }))
  }

  const handleSave = () => {
    onSave(localGradeScale)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="absolute top-4 right-4">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Grade Scale Settings</DialogTitle>
          <DialogDescription>Customize the grade scale for your CGPA calculation.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {Object.entries(localGradeScale).map(([grade, { value, range }]) => (
            <div key={grade} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`${grade}-value`} className="text-right">
                {grade}
              </Label>
              <Input
                id={`${grade}-value`}
                type="number"
                value={value}
                onChange={(e) => handleChange(grade, "value", e.target.value)}
                className="col-span-1"
              />
              <Input
                id={`${grade}-range`}
                value={range}
                onChange={(e) => handleChange(grade, "range", e.target.value)}
                className="col-span-1"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

