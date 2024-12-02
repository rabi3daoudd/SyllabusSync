"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { auth, db } from "@/firebase-config"

import NoteEditor from "./components/note-editor"
import Sidebar from "./components/sidebar"

// Define the Note schema
const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Note = z.infer<typeof noteSchema>

export default function NotePadPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            const validatedNotes = z
              .array(noteSchema)
              .parse(userData.notes || [])
            setNotes(validatedNotes)
          } else {
            console.error("No user document found!")
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            setError(error)
          } else {
            setError(new Error("An error occurred while fetching notes"))
          }
          console.error("Failed to fetch notes:", error)
        } finally {
          setLoading(false)
        }
      } else {
        router.push("/login")
      }
    })

    return unsubscribe
  }, [])

  const handleCreateNote = async (newNote: Note) => {
    try {
      const user = auth.currentUser
      if (!user) return

      const updatedNotes = [...notes, newNote]
      setNotes(updatedNotes)

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        notes: updatedNotes,
      })
    } catch (error) {
      console.error("Error creating note:", error)
    }
  }

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      const user = auth.currentUser
      if (!user) return

      const updatedNotes = notes.map((note) => 
        note.id === updatedNote.id ? updatedNote : note
      )
      setNotes(updatedNotes)

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        notes: updatedNotes,
      })
    } catch (error) {
      console.error("Error updating note:", error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const user = auth.currentUser
      if (!user) return

      const updatedNotes = notes.filter((note) => note.id !== noteId)
      setNotes(updatedNotes)

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        notes: updatedNotes,
      })

      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const handleSelectNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId) || null;
    setSelectedNote(note);
  };

  if (loading) {
    return <div>Loading notes...</div>
  }

  if (error) {
    return <div>Failed to load notes</div>
  }

  return (
    <div className="flex h-screen">
      <Sidebar 
        notes={notes}
        selectedNoteId={selectedNote?.id || null}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
      />
      <NoteEditor
        note={selectedNote}
        onUpdateNote={handleUpdateNote}
      />
    </div>
  )
}

