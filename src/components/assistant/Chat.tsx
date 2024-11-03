'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { auth } from '../../firebase-config';
import { findOrCreateSyallbusSyncCalendar } from '@/components/FindOrCreateSyallbusSyncCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Send, Loader2, Globe, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudiostart: ((ev: Event) => void) | null;
  onaudioend: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onsoundstart: ((ev: Event) => void) | null;
  onsoundend: ((ev: Event) => void) | null;
  onspeechstart: ((ev: Event) => void) | null;
  onspeechend: ((ev: Event) => void) | null;
  onstart: ((ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly interpretation: unknown;
  readonly emma: Document;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error:
      | 'no-speech'
      | 'aborted'
      | 'audio-capture'
      | 'network'
      | 'not-allowed'
      | 'service-not-allowed'
      | 'bad-grammar'
      | 'language-not-supported';
  message: string;
}

export default function ChatBot() {
  const [calendarId, setCalendarId] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [listening, setListening] = useState<boolean>(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] =
      useState<boolean>(false);

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
  };

  // Define the type for language keys
  type LanguageKey = keyof typeof translations;

  // Update the language state to use LanguageKey
  const [language, setLanguage] = useState<LanguageKey>('en');

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
  ];

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<string>('');

  const languageCodes: { [key in LanguageKey]: string } = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ru: 'ru-RU',
    ar: 'ar-SA',
    pt: 'pt-PT',
    hi: 'hi-IN',
    ko: 'ko-KR',
    tr: 'tr-TR',
    nl: 'nl-NL',
    pl: 'pl-PL',
    sv: 'sv-SE',
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput, // Destructure setInput from useChat
  } = useChat({
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
  });

  // Initialize Speech Recognition
  useEffect(() => {
    if (
        typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      setIsSpeechRecognitionSupported(true);

      const SpeechRecognitionConstructor =
          window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor();

      recognition.continuous = false;
      recognition.lang = languageCodes[language] || 'en-US';

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        const newValue = inputRef.current
            ? inputRef.current + ' ' + transcript
            : transcript;

        // Use setInput directly to update the input value
        setInput(newValue);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechRecognitionSupported(false);
      console.error('Speech recognition not supported in this browser.');
    }
  }, [language, setInput]);

  const handleSpeech = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      if (listening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      console.error('Speech recognition not initialized.');
    }
  };

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const syncCalendarId = await findOrCreateSyallbusSyncCalendar();
          setCalendarId(syncCalendarId);
        } catch (error) {
          console.error('Error initializing calendar:', error);
        }
      } else {
        setUserId(null);
        setCalendarId('');
      }
    });

    return () => unsubscribe();
  }, []);

  const [extractedInfo, setExtractedInfo] = useState<string | null>(null);

  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant') {
        handleExtractedInfo(message.content);
      }
    });
  }, [messages]);

  const handleExtractedInfo = (content: string) => {
    const match = content.match(
        /<calendar_api_call>([\s\S]*?)<\/calendar_api_call>/
    );
    if (match) {
      setExtractedInfo(match[1]);
    }
  };

  if (!userId) {
    return null;
  }

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
          {/* Updated CardHeader */}
          <CardHeader className="bg-primary text-primary-foreground p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">SyllabusSync Assistant</CardTitle>
              <div className="w-32">
                <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as LanguageKey)}
                >
                  <SelectTrigger
                      className="h-8 w-full flex items-center justify-between rounded-md border border-primary bg-primary text-primary-foreground px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      aria-label="Language selection"
                  >
                    <div className="flex items-center">
                      <Globe
                          className="w-4 h-4 mr-1 text-white"
                          aria-label="Select language"
                      />
                      <SelectValue placeholder="Language" />
                    </div>
                    {/* Chevron icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-white opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
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
                const isAssistant = message.role === 'assistant';
                return (
                    <div
                        key={message.id}
                        className={`mb-4 p-3 rounded-lg ${
                            isAssistant
                                ? 'bg-[#A5F8F1] text-black'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      <strong className="block mb-1">
                        {isAssistant
                            ? translations[language].assistant
                            : translations[language].you}
                      </strong>
                      {isAssistant ? (
                          <ReactMarkdown className="prose prose-sm max-w-none">
                            {message.content}
                          </ReactMarkdown>
                      ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                );
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
            <form
                onSubmit={handleSubmit}
                className="flex w-full space-x-2"
                data-testid="chat-form"
            >
              <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={translations[language].placeholder}
                  disabled={isLoading}
                  className="flex-grow"
                  data-testid="chat-input"
              />
              {isSpeechRecognitionSupported && (
                  <Button
                      type="button"
                      onClick={handleSpeech}
                      className="w-12"
                      aria-label={listening ? 'Stop recording' : 'Start recording'}
                  >
                    {listening ? (
                        <Mic className="w-4 h-4 text-red-500" aria-hidden="true" />
                    ) : (
                        <Mic className="w-4 h-4" aria-hidden="true" />
                    )}
                  </Button>
              )}
              <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-24"
                  aria-label={
                    isLoading
                        ? translations[language].sending
                        : translations[language].send
                  }
              >
                {isLoading ? (
                    <Loader2
                        className="w-4 h-4 animate-spin"
                        aria-hidden="true"
                    />
                ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="ml-2">
                {isLoading
                    ? translations[language].sending
                    : translations[language].send}
              </span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
  );
}
