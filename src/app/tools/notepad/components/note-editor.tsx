"use client";

import { useState, useCallback, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Bold,
    Code,
    Italic,
    Link2,
    List,
    ListOrdered,
    Minus,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Note } from "../page";

interface NoteEditorProps {
    note: Note | null;
    onUpdateNote: (note: Note) => void;
}

interface HistoryItem {
    content: string;
    cursorPosition: number;
}

export default function NoteEditor({ note, onUpdateNote }: NoteEditorProps) {
    // Initialize hooks at the top level
    const [localNote, setLocalNote] = useState<Note | null>(note);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Sync note on prop changes
    useEffect(() => {
        if (note) {
            setLocalNote(note);
            setHistory([{ content: note.content, cursorPosition: 0 }]);
            setHistoryIndex(0);
        }
    }, [note]);

    // Save updates with debounce
    useEffect(() => {
        if (!localNote) return;
        const timer = setTimeout(() => {
            onUpdateNote(localNote);
        }, 500);
        return () => clearTimeout(timer);
    }, [localNote, onUpdateNote]);

    // Update note content
    const updateNoteContent = useCallback(
        (content: string, cursorPosition: number) => {
            if (content !== localNote?.content) {
                setLocalNote((prev) => {
                    if (!prev) return null; // Handle null case explicitly
                    return { ...prev, content };
                });
                const newHistoryItem = { content, cursorPosition };
                setHistory((prev) => [...prev.slice(0, historyIndex + 1), newHistoryItem]);
                setHistoryIndex((prev) => prev + 1);
            }
        },
        [localNote, historyIndex]
    );


    // Update note title
    const updateNoteTitle = (title: string) => {
        setLocalNote((prev) => {
            if (!prev) return null; // Handle null case explicitly
            return { ...prev, title };
        });
    };


    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const previousState = history[newIndex];
            setLocalNote((prev) => {
                if (!prev) return null; // Handle null case explicitly
                return { ...prev, content: previousState.content };
            });
            setHistoryIndex(newIndex);

            setTimeout(() => {
                const textarea = document.querySelector("textarea");
                if (textarea) {
                    textarea.focus();
                    textarea.setSelectionRange(previousState.cursorPosition, previousState.cursorPosition);
                }
            }, 0);
        }
    }, [history, historyIndex]);


    // Redo functionality
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const nextState = history[newIndex];
            setLocalNote((prev) => {
                if (!prev) return null; // Handle null case explicitly
                return { ...prev, content: nextState.content };
            });
            setHistoryIndex(newIndex);

            setTimeout(() => {
                const textarea = document.querySelector("textarea");
                if (textarea) {
                    textarea.focus();
                    textarea.setSelectionRange(nextState.cursorPosition, nextState.cursorPosition);
                }
            }, 0);
        }
    }, [history, historyIndex]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        }
    };

    // Insert text for formatting
    const insertText = useCallback(
        (before: string, after: string = "") => {
            const textarea = document.querySelector("textarea");
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = localNote?.content.substring(start, end) || "";
                const newContent =
                    localNote?.content.substring(0, start) +
                    before +
                    selectedText +
                    after +
                    localNote?.content.substring(end);
                updateNoteContent(newContent || "", start + before.length + selectedText.length + after.length);

                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + before.length, end + before.length);
                }, 0);
            }
        },
        [localNote, updateNoteContent]
    );

    // Format text with markdown
    const formatText = useCallback(
        (type: string) => {
            switch (type) {
                case "h1":
                    insertText("# ");
                    break;
                case "h2":
                    insertText("## ");
                    break;
                case "h3":
                    insertText("### ");
                    break;
                case "bold":
                    insertText("**", "**");
                    break;
                case "italic":
                    insertText("*", "*");
                    break;
                case "code":
                    insertText("`", "`");
                    break;
                case "link":
                    insertText("[", "](url)");
                    break;
                case "orderedList":
                    insertText("1. ");
                    break;
                case "unorderedList":
                    insertText("- ");
                    break;
                case "horizontalRule":
                    insertText("\n---\n");
                    break;
                default:
                    break;
            }
        },
        [insertText]
    );

    if (!note) {
        return <div className="flex-1 p-4">Select a note to edit</div>;
    }

    return (
        <div className="space-y-4">
            <Input
                value={localNote?.title || ""}
                onChange={(e) => updateNoteTitle(e.target.value)}
                className="text-2xl font-bold"
                placeholder="Note Title"
            />

            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background">
                    <Button variant="ghost" size="icon" onClick={() => formatText("h1")}>
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("h2")}>
                        <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("h3")}>
                        <Heading3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("bold")}>
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("italic")}>
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("code")}>
                        <Code className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("link")}>
                        <Link2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("orderedList")}>
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("unorderedList")}>
                        <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => formatText("horizontalRule")}>
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
                    value={localNote?.content || ""}
                    onInput={(e) =>
                        updateNoteContent(e.currentTarget.value, e.currentTarget.selectionStart)
                    }
                    onKeyDown={handleKeyDown}
                    className="min-h-[calc(100vh-250px)] mb-2 resize-none"
                    placeholder="Write your note here..."
                />
                <div className="border rounded-md p-4 overflow-auto">
                    <ReactMarkdown>{localNote?.content || ""}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
