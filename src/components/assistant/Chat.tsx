'use client'

import { useState, useEffect } from 'react'
import { useChat } from 'ai/react'
import { auth } from "../../firebase-config"
import { findOrCreateSyallbusSyncCalendar } from '@/components/FindOrCreateSyallbusSyncCalendar'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { onAuthStateChanged } from 'firebase/auth'

export default function ChatBot() {
  const [calendarId, setCalendarId] = useState<string>("")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
    body: {
      calendarId
    },
    headers: userId ? {
      'Authorization': `Bearer ${userId}`
    } : undefined
  })

  const [extractedInfo, setExtractedInfo] = useState<string | null>(null)

  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant') {
        handleExtractedInfo(message.content)
      }
    })
  }, [messages])

  const handleExtractedInfo = (content: string) => {
    const match = content.match(/<calendar_api_call>([\s\S]*?)<\/calendar_api_call>/)
    if (match) {
      setExtractedInfo(match[1])
    }
  }

  if (!userId) {
    return null // Or a loading state
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl">SyllabusSync Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full p-4">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant'
              return (
                <div
                  key={message.id}
                  className={`mb-4 p-3 rounded-lg ${
                    isAssistant ? 'bg-[#A5F8F1] text-black' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <strong className="block mb-1">{isAssistant ? 'SyllabusSync:' : 'You:'}</strong>
                  {isAssistant ? (
                    <ReactMarkdown className="prose prose-sm max-w-none">
                      {message.content}
                    </ReactMarkdown>
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
            <CardContent className="p-4 bg-green-50">
              <h3 className="font-semibold mb-2 text-green-800">Extracted Calendar Information:</h3>
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
            />
            <Button type="submit" disabled={isLoading} className="w-24">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="ml-2">{isLoading ? 'Sending' : 'Send'}</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
