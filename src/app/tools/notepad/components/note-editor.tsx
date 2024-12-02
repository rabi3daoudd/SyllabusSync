"use client"

import { useState, useCallback, useEffect, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Code, Italic, Link2, List, ListOrdered, Minus, Heading1, Heading2, Heading3, Undo, Redo } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Note } from "../page"
import { cn } from "@/lib/utils"

interface NoteEditorProps {
  note: Note
  onUpdateNote: (note: Note) => void
}

interface HistoryItem {
  content: string
  cursorPosition: number
}

export default function NoteEditor({ note, onUpdateNote }: NoteEditorProps) {
  const [localNote, setLocalNote] = useState(note)
  const [history, setHistory] = useState<HistoryItem[]>([{ content: note.content, cursorPosition: 0 }])
  const [historyIndex, setHistoryIndex] = useState(0)

  useEffect(() => {
    setLocalNote(note)
    setHistory([{ content: note.content, cursorPosition: 0 }])
    setHistoryIndex(0)
  }, [note])

  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdateNote(localNote)
    }, 500)

    return () => clearTimeout(timer)
  }, [localNote, onUpdateNote])

  const updateNoteContent = (content: string, cursorPosition: number) => {
    if (content !== localNote.content) {
      setLocalNote(prev => ({ ...prev, content }))
      const newHistoryItem = { content, cursorPosition }
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistoryItem])
      setHistoryIndex(prev => prev + 1)
    }
  }

  const updateNoteTitle = (title: string) => {
    setLocalNote(prev => ({ ...prev, title }))
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const previousState = history[newIndex]
      setLocalNote(prev => ({ ...prev, content: previousState.content }))
      setHistoryIndex(newIndex)

      setTimeout(() => {
        const textarea = document.querySelector('textarea')
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(previousState.cursorPosition, previousState.cursorPosition)
        }
      }, 0)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const nextState = history[newIndex]
      setLocalNote(prev => ({ ...prev, content: nextState.content }))
      setHistoryIndex(newIndex)

      setTimeout(() => {
        const textarea = document.querySelector('textarea')
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(nextState.cursorPosition, nextState.cursorPosition)
        }
      }, 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
    }
  }

  const insertText = useCallback((before: string, after: string = "") => {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = localNote.content.substring(start, end)
      const newContent = localNote.content.substring(0, start) + before + selectedText + after + localNote.content.substring(end)
      updateNoteContent(newContent, start + before.length + selectedText.length + after.length)
      
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, end + before.length)
      }, 0)
    }
  }, [localNote.content])

  const formatText = useCallback((type: string) => {
    switch (type) {
      case 'h1':
        insertText('# ')
        break
      case 'h2':
        insertText('## ')
        break
      case 'h3':
        insertText('### ')
        break
      case 'bold':
        insertText('**', '**')
        break
      case 'italic':
        insertText('*', '*')
        break
      case 'code':
        insertText('`', '`')
        break
      case 'link':
        insertText('[', '](url)')
        break
      case 'orderedList':
        insertText('1. ')
        break
      case 'unorderedList':
        insertText('- ')
        break
      case 'horizontalRule':
        insertText('\n---\n')
        break
    }
  }, [insertText])

  return (
    <div className="space-y-4">
      <Input 
        value={localNote.title}
        onChange={(e) => updateNoteTitle(e.target.value)}
        className="text-2xl font-bold"
        placeholder="Note Title"
      />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background">
          <Button variant="ghost" size="icon" onClick={() => formatText('h1')}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('h2')}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('h3')}>
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('bold')}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('italic')}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('code')}>
            <Code className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('link')}>
            <Link2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('orderedList')}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('unorderedList')}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => formatText('horizontalRule')}>
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={undo} title="Undo (Ctrl+Z)">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} title="Redo (Ctrl+Shift+Z)">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Textarea 
          value={localNote.content}
          onInput={(e) => updateNoteContent(e.currentTarget.value, e.currentTarget.selectionStart)}
          onKeyDown={handleKeyDown}
          className="min-h-[calc(100vh-250px)] mb-2 resize-none"
          placeholder="Write your note here..."
        />
        <div className="border rounded-md p-4 overflow-auto">
          <ReactMarkdown
            components={{
              h1: ({ className, ...props }) => (
                <h1 className={cn("mt-2 scroll-m-20 text-4xl font-bold tracking-tight", className)} {...props} />
              ),
              h2: ({ className, ...props }) => (
                <h2 className={cn("mt-10 scroll-m-20 border-b pb-1 text-3xl font-semibold tracking-tight first:mt-0", className)} {...props} />
              ),
              h3: ({ className, ...props }) => (
                <h3 className={cn("mt-8 scroll-m-20 text-2xl font-semibold tracking-tight", className)} {...props} />
              ),
              h4: ({ className, ...props }) => (
                <h4 className={cn("mt-8 scroll-m-20 text-xl font-semibold tracking-tight", className)} {...props} />
              ),
              h5: ({ className, ...props }) => (
                <h5 className={cn("mt-8 scroll-m-20 text-lg font-semibold tracking-tight", className)} {...props} />
              ),
              h6: ({ className, ...props }) => (
                <h6 className={cn("mt-8 scroll-m-20 text-base font-semibold tracking-tight", className)} {...props} />
              ),
              a: ({ className, ...props }) => (
                <a className={cn("font-medium underline underline-offset-4", className)} {...props} />
              ),
              p: ({ className, ...props }) => (
                <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)} {...props} />
              ),
              ul: ({ className, ...props }) => (
                <ul className={cn("my-6 ml-6 list-disc", className)} {...props} />
              ),
              ol: ({ className, ...props }) => (
                <ol className={cn("my-6 ml-6 list-decimal", className)} {...props} />
              ),
              li: ({ className, ...props }) => (
                <li className={cn("mt-2", className)} {...props} />
              ),
              blockquote: ({ className, ...props }) => (
                <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)} {...props} />
              ),
              img: ({ className, alt, ...props }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={cn("rounded-md border", className)} alt={alt} {...props} />
              ),
              hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
              table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
                <div className="my-6 w-full overflow-y-auto">
                  <table className={cn("w-full", className)} {...props} />
                </div>
              ),
              tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
                <tr className={cn("m-0 border-t p-0 even:bg-muted", className)} {...props} />
              ),
              th: ({ className, ...props }) => (
                <th className={cn("border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right", className)} {...props} />
              ),
              td: ({ className, ...props }) => (
                <td className={cn("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right", className)} {...props} />
              ),
              pre: ({ className, ...props }) => (
                <pre className={cn("mb-4 mt-6 overflow-x-auto rounded-lg border bg-black py-4", className)} {...props} />
              ),
              code: ({ className, ...props }) => (
                <code className={cn("relative rounded border px-[0.3rem] py-[0.2rem] font-mono text-sm", className)} {...props} />
              ),
            }}
          >
            {localNote.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

