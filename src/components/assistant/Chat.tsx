'use client'

import { useState, useEffect } from 'react'
import { useChat } from 'ai/react'
import { auth } from '../../firebase-config'
import { findOrCreateSyallbusSyncCalendar } from '@/components/FindOrCreateSyallbusSyncCalendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Send, Loader2, Globe } from 'lucide-react' // Ensure Globe is correctly imported
import ReactMarkdown from 'react-markdown'
import { onAuthStateChanged } from 'firebase/auth'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select' // Removed SelectIcon import

export default function ChatBot() {
  const [calendarId, setCalendarId] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)
  const [language, setLanguage] = useState<string>('en')

  const translations = {
    en: {
      placeholder: 'Type your message here...',
      send: 'Send',
      sending: 'Sending',
      you: 'You:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Extracted Calendar Information:',
    },
    es: {
      placeholder: 'Escribe tu mensaje aquí...',
      send: 'Enviar',
      sending: 'Enviando',
      you: 'Tú:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Información de Calendario Extraída:',
    },
    fr: {
      placeholder: 'Tapez votre message ici...',
      send: 'Envoyer',
      sending: 'Envoi',
      you: 'Vous :',
      assistant: 'SyllabusSync :',
      extractedInfoTitle: 'Informations du Calendrier Extraites :',
    },
    // Add more languages as needed
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        try {
          const syncCalendarId = await findOrCreateSyallbusSyncCalendar()
          setCalendarId(syncCalendarId)
        } catch (error) {
          console.error('Error initializing calendar:', error)
        }
      } else {
        setUserId(null)
        setCalendarId('')
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/assistant',
    body: {
      calendarId,
      language,
    },
    headers: userId
        ? {
          Authorization: `Bearer ${userId}`,
        }
        : undefined,
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

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    // Add more languages as needed
  ]

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
          <CardHeader className="flex flex-col space-y-1.5 p-6 bg-primary text-primary-foreground">
            <div className="flex justify-between items-center w-full">
              <h3 className="font-semibold tracking-tight text-2xl">SyllabusSync Assistant</h3>
              <div className="w-32">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="h-8 w-full flex items-center justify-between rounded-md border border-input bg-primary text-primary-foreground px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-1 text-white" />
                      <SelectValue placeholder="Language" />
                    </div>
                    {/* Manually add chevron down icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-white opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </SelectTrigger>
                  <SelectContent className="bg-primary text-primary-foreground">
                    {languageOptions.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-primary-foreground"
                        >
                          {option.label}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                      <strong className="block mb-1">
                        {isAssistant ? translations[language].assistant : translations[language].you}
                      </strong>
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
                  <h3 className="font-semibold mb-2 text-green-800">
                    {translations[language].extractedInfoTitle}
                  </h3>
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
                  placeholder={translations[language].placeholder}
                  disabled={isLoading}
                  className="flex-grow"
                  data-testid="chat-input"
              />
              <Button type="submit" disabled={isLoading} className="w-24">
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
                <span className="ml-2">
                {isLoading ? translations[language].sending : translations[language].send}
              </span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
  )
}
