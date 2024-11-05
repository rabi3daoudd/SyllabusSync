'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { useDropzone } from 'react-dropzone';
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
import { Send, Loader2, Globe, Mic, X } from 'lucide-react';
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
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showDropzone, setShowDropzone] = useState<boolean>(false); // Control global drop zone visibility
  
  let dragCounter = 0; // Counter to track drag events

  const translations = {
    en: {
      placeholder: 'Type your message here...',
      send: 'Send',
      sending: 'Sending',
      you: 'You:',
      assistant: 'SyllabusSync:',
      extractedInfoTitle: 'Extracted Calendar Information:',
    },
    // ... other translations
  };

  type LanguageKey = keyof typeof translations;
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

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/assistant',
    body: { calendarId, language },
    headers: userId ? { Authorization: `Bearer ${userId}` } : undefined,
  });

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    setShowDropzone(false); // Hide dropzone after dropping files
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    noClick: true, // Disable click to open file dialog
  });

  const deleteFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      setIsSpeechRecognitionSupported(true);

      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor();

      recognition.continuous = false;
      recognition.lang = language;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
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
      listening ? recognition.stop() : recognition.start();
    } else {
      console.error('Speech recognition not initialized.');
    }
  };

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

  // Global event listeners for drag events to control drop zone visibility
  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault();
      dragCounter += 1;
      setShowDropzone(true); // Show dropzone on drag enter
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      dragCounter -= 1;
      if (dragCounter === 0) {
        setShowDropzone(false); // Hide dropzone if no more drag items
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      dragCounter = 0; // Reset counter on drop
      setShowDropzone(false); // Hide dropzone on drop
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">SyllabusSync Assistant</CardTitle>
            <div className="w-32">
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value as LanguageKey)}
              >
                <SelectTrigger className="h-8 w-full flex items-center justify-between rounded-md border border-primary bg-primary text-primary-foreground px-2 py-1 text-sm">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-1 text-white" aria-label="Select language" />
                    <SelectValue placeholder="Language" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-primary text-primary-foreground">
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-primary-foreground">
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
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 p-3 rounded-lg ${message.role === 'assistant' ? 'bg-[#A5F8F1] text-black' : 'bg-gray-100 text-gray-800'}`}>
                <strong className="block mb-1">
                  {message.role === 'assistant' ? translations[language].assistant : translations[language].you}
                </strong>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ))}
          </ScrollArea>
        </CardContent>

        {showDropzone && (
          <div
            {...getRootProps()}
            className="p-4 border-dashed border-2 bg-primary rounded-lg text-center mb-4 text-primary-foreground"
          >
            <input {...getInputProps()} />
            <p>Drag & drop files here</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="p-4 bg-primary text-primary-foreground rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Uploaded Files:</h3>
            <ul>
              {files.map((file, index) => (
                <li key={file.name} className="flex items-center justify-between">
                  <span>{file.name}</span>
                  <Button onClick={() => deleteFile(index)} variant="ghost" className="ml-2">
                    <X className="w-4 h-4 text-red-500" aria-label="Delete file" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        <CardFooter className="p-4">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input value={input} onChange={handleInputChange} placeholder={translations[language].placeholder} disabled={isLoading} className="flex-grow" />
            {isSpeechRecognitionSupported && (
              <Button
                type="button"
                onClick={handleSpeech}
                className="w-12"
                aria-label={listening ? 'Stop recording' : 'Start recording'}
              >
                <Mic className={listening ? "text-red-500" : ""} aria-hidden="true" />
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="w-24">
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              <span className="ml-2">{isLoading ? translations[language].sending : translations[language].send}</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

