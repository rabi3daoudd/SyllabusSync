import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, Trash, File } from 'lucide-react'
import { Note } from "../page"

interface SidebarProps {
  notes: Note[]
  selectedNoteId: string | null
  onSelectNote: (id: string) => void
  onDeleteNote: (id: string) => void
  onCreateNote: (note: Note) => Promise<void>
}

export default function Sidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
  onCreateNote
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-64 border-r bg-muted/50 flex flex-col h-screen">
      <div className="px-6 pt-8 pb-4 border-b">
        <h2 className="text-lg font-semibold mb-2 mt-2">Notes</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search notes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-grow">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`flex items-center justify-between p-2 cursor-pointer hover:bg-muted ${
              selectedNoteId === note.id ? "bg-muted" : ""
            }`}
            onClick={() => onSelectNote(note.id)}
          >
            <div className="flex items-center space-x-2">
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{note.title}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNote(note.id)
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <Button 
          onClick={() => onCreateNote({
            id: crypto.randomUUID(),
            title: "New Note",
            content: "",
            createdAt: Date.now(),
            updatedAt: Date.now()
          })} 
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>
    </div>
  )
}

