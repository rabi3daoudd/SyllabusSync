"use client"

import { useState, useEffect } from "react"
import Sidebar from "./components/sidebar"
import NoteEditor from "./components/note-editor"

export interface Note {
  id: string
  title: string
  content: string
}

export default function NoteTakingApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes')
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  }, [notes])

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: ""
    }
    setNotes([...notes, newNote])
    setSelectedNoteId(newNote.id)
  }

  const updateNote = (updatedNote: Note) => {
    setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note))
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
    if (selectedNoteId === id) {
      setSelectedNoteId(notes.length > 1 ? notes[0].id : null)
    }
  }

  const selectedNote = notes.find(note => note.id === selectedNoteId)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        onAddNote={addNote}
        onDeleteNote={deleteNote}
      />
      <main className="flex-1 p-6">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onUpdateNote={updateNote}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a note or create a new one
          </div>
        )}
      </main>
    </div>
  )
}

