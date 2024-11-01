'use client'

import { useState, useEffect } from 'react'
import { useChat } from 'ai/react'
import { auth, db } from "../../firebase-config"
import { findOrCreateSyallbusSyncCalendar } from '@/components/FindOrCreateSyallbusSyncCalendar'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Send, Loader2, Sun, Moon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export default function ChatBot() {
  const [calendarId, setCalendarId] = useState<string>("")
  const [userId, setUserId] = useState<string | null>(null)
  const [theme, setTheme] = useState("light")
  const [assistantTextColor, setAssistantTextColor] = useState("#000000") // Text color for assistant messages
  const [backgroundColor, setBackgroundColor] = useState("#A5F8F1") // Background color for assistant messages and CardHeader
  const [extractedInfo, setExtractedInfo] = useState<string | null>(null) // Extracted info state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            setTheme(userData.theme || "light")
            setAssistantTextColor(userData.assistantTextColor || "#000000")
            setBackgroundColor(userData.backgroundColor || "#A5F8F1")
          } else {
            console.error("No user document found!")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
        setUserId(user.uid)
        try {
          const syncCalendarId = await findOrCreateSyallbusSyncCalendar()
          setCalendarId(syncCalendarId)
        } catch (error) {
          console.error("Error initializing calendar:", error)
        }
      } else {
        setUserId(null)
        setCalendarId("")
      }
    })

    return () => unsubscribe()
  }, [])

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/assistant',
    body: { calendarId },
    headers: userId ? { 'Authorization': `Bearer ${userId}` } : undefined
  })

  const handleColorChange = async (colorType: string, colorValue: string) => {
    if (!userId) return
    const userDocRef = doc(db, 'users', userId)
    const colorUpdate: { [key: string]: string } = { [colorType]: colorValue }
    try {
      await updateDoc(userDocRef, colorUpdate)
      if (colorType === "assistantTextColor") setAssistantTextColor(colorValue)
      if (colorType === "backgroundColor") setBackgroundColor(colorValue)
    } catch (error) {
      console.error("Error updating color:", error)
    }
  }

  const handleExtractedInfo = (content: string) => {
    const match = content.match(/<calendar_api_call>([\s\S]*?)<\/calendar_api_call>/)
    if (match) {
      setExtractedInfo(match[1])
    }
  }

  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant') {
        handleExtractedInfo(message.content)
      }
    })
  }, [messages])

  const toggleTheme = async () => {
    const user = auth.currentUser
    if (!user) return console.error("No user logged in!")
    const newTheme = theme === "light" ? "dark" : "light"
    console.log(`Toggling theme to: ${newTheme}`);
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { theme: newTheme })
      setTheme(newTheme)
    } catch (error) {
      console.error("Error changing theme:", error)
    }
  }

  if (!userId) return null // Or a loading state

  return (
    <div className={`flex items-center justify-center min-h-screen ${theme === "light" ? "bg-gray-100" : "bg-gray-900 text-white"}`}>
      <div className="absolute top-4 right-4 space-x-2">
        <Button onClick={toggleTheme}>
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span className="ml-2">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </Button>
        <Label className= "text-sm font-medium text-gray-900">
          Assistant Text Color:
          <input type="color" value={assistantTextColor} onChange={(e) => handleColorChange("assistantTextColor", e.target.value)} />
        </Label>  
        <Label className= "text-sm font-medium text-gray-900" >
          Background Color: 
        </Label>
        <input type="color" value={backgroundColor} onChange={(e) => handleColorChange("backgroundColor", e.target.value)} />
      </div>
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader style={{ backgroundColor: backgroundColor, color: "#FFFFFF" }}>
          <CardTitle className="text-2xl">SyllabusSync Assistant</CardTitle>
        </CardHeader>
        <CardContent data-testid="chatbot-container" className={`flex-grow overflow-hidden p-0 ${theme === "light" ? "bg-gray-100" : "bg-gray-900"}`}>
          <ScrollArea className="h-full p-4">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant'
              return (
                <div
                  key={message.id}
                  className="mb-4 p-3 rounded-lg"
                  style={{
                    backgroundColor: backgroundColor,
                    color: assistantTextColor,
                  }}
                >
                  <strong className="block mb-1">{isAssistant ? 'SyllabusSync:' : 'You:'}</strong>
                  {isAssistant ? (
                    <ReactMarkdown className="prose prose-sm max-w-none">{message.content}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              )
            })}
          </ScrollArea>
        </CardContent>
        {extractedInfo && (
          <>
            <Separator />
            <CardContent className={`p-4 ${theme === "light" ? "bg-green-50 text-green-800" : "bg-green-900 text-green-200"}`}>
              <h3 className="font-semibold mb-2">Extracted Calendar Information:</h3>
              <pre className="bg-white p-2 rounded text-sm overflow-x-auto border border-green-200">
                {extractedInfo}
              </pre>
            </CardContent>
          </>
        )}
        <Separator />
        <CardFooter className="p-4">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2" data-testid="chat-form">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message here..."
              disabled={isLoading}
              className="flex-grow"
              data-testid="chat-input"
              style={{ color: assistantTextColor }}
            />
            <Button type="submit" disabled={isLoading} className="w-24" style={{ backgroundColor: backgroundColor }}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="ml-2">{isLoading ? 'Sending' : 'Send'}</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
