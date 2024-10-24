'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Send, Loader2 } from 'lucide-react'

export default function ChatBot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/assistant',
  })

  const [extractedInfo, setExtractedInfo] = useState<string | null>(null)

  const handleExtractedInfo = (content: string) => {
    const match = content.match(/<calendar_api_call>([\s\S]*?)<\/calendar_api_call>/)
    if (match) {
      setExtractedInfo(match[1])
    }
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
              if (isAssistant) {
                handleExtractedInfo(message.content)
              }
              return (
                <div
                  key={message.id}
                  className={`mb-4 p-3 rounded-lg ${
                    isAssistant ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <strong className="block mb-1">{isAssistant ? 'SyllabusSync:' : 'You:'}</strong>
                  <p className="whitespace-pre-wrap">{message.content}</p>
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
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message here..."
              disabled={isLoading}
              className="flex-grow"
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