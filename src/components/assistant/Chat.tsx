'use client'

import { useState, useEffect } from 'react'
import { useChat } from 'ai/react'
import { auth } from '../../firebase-config'
import { findOrCreateSyallbusSyncCalendar } from '@/components/FindOrCreateSyallbusSyncCalendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Send, Loader2, Globe } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { onAuthStateChanged } from 'firebase/auth'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export default function ChatBot() {
  const [calendarId, setCalendarId] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)

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
    de: {
      placeholder: 'Geben Sie hier Ihre Nachricht ein...',
      send: 'Senden',
      sending: 'Wird gesendet',
      you: 'Sie:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Extrahierte Kalenderinformationen:',
    },
    it: {
      placeholder: 'Digita qui il tuo messaggio...',
      send: 'Invia',
      sending: 'Invio',
      you: 'Tu:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Informazioni del Calendario Estratte:',
    },
    zh: {
      placeholder: '在此输入您的消息...',
      send: '发送',
      sending: '发送中',
      you: '您：',
      assistant: 'SyllabusSync：',
      extractedInfoTitle: '提取的日历信息：',
    },
    ja: {
      placeholder: 'ここにメッセージを入力してください...',
      send: '送信',
      sending: '送信中',
      you: 'あなた:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: '抽出されたカレンダー情報:',
    },
    ru: {
      placeholder: 'Введите ваше сообщение здесь...',
      send: 'Отправить',
      sending: 'Отправка',
      you: 'Вы:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Извлеченная информация из календаря:',
    },
    ar: {
      placeholder: 'اكتب رسالتك هنا...',
      send: 'إرسال',
      sending: 'جارٍ الإرسال',
      you: 'أنت:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'معلومات التقويم المستخرجة:',
    },
    pt: {
      placeholder: 'Digite sua mensagem aqui...',
      send: 'Enviar',
      sending: 'Enviando',
      you: 'Você:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Informações do Calendário Extraídas:',
    },
    hi: {
      placeholder: 'अपना संदेश यहाँ टाइप करें...',
      send: 'भेजें',
      sending: 'भेजा जा रहा है',
      you: 'आप:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'निकाली गई कैलेंडर जानकारी:',
    },
    ko: {
      placeholder: '여기에 메시지를 입력하세요...',
      send: '보내기',
      sending: '보내는 중',
      you: '당신:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: '추출된 캘린더 정보:',
    },
    tr: {
      placeholder: 'Mesajınızı buraya yazın...',
      send: 'Gönder',
      sending: 'Gönderiliyor',
      you: 'Sen:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Çıkarılan Takvim Bilgileri:',
    },
    nl: {
      placeholder: 'Typ hier uw bericht...',
      send: 'Versturen',
      sending: 'Bezig met verzenden',
      you: 'U:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Opgehaalde Kalenderinformatie:',
    },
    pl: {
      placeholder: 'Wpisz tutaj swoją wiadomość...',
      send: 'Wyślij',
      sending: 'Wysyłanie',
      you: 'Ty:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Wyodrębnione Informacje z Kalendarza:',
    },
    sv: {
      placeholder: 'Skriv ditt meddelande här...',
      send: 'Skicka',
      sending: 'Skickar',
      you: 'Du:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Utdragen Kalenderinformation:',
    },
  }

  // Define the type for language keys
  type LanguageKey = keyof typeof translations;

  // Update the language state to use LanguageKey
  const [language, setLanguage] = useState<LanguageKey>('en')

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' },
    { value: 'ru', label: 'Русский' },
    { value: 'ar', label: 'العربية' },
    { value: 'pt', label: 'Português' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'ko', label: '한국어' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'pl', label: 'Polski' },
    { value: 'sv', label: 'Svenska' },
    // Add more languages as needed
  ]

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

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/assistant',
    body: {
      calendarId,
      language, // Include the selected language
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

  return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
          {/* Updated CardHeader */}
          <CardHeader className="bg-primary text-primary-foreground p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">SyllabusSync Assistant</CardTitle>
              <div className="w-32">
                <Select value={language} onValueChange={(value) => setLanguage(value as LanguageKey)}>
                  <SelectTrigger className="h-8 w-full flex items-center justify-between rounded-md border border-primary bg-primary text-primary-foreground px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-1 text-white" />
                      <SelectValue placeholder="Language" />
                    </div>
                    {/* Chevron icon */}
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