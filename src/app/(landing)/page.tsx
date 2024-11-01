'use client';

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, BookOpen, Clock, CheckCircle } from 'lucide-react'

const typingPhrases = [
  "Ace your exams",
  "Never miss a deadline",
  "Boost your GPA",
  "Master time management",
  "Reduce study stress"
]

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [typingText, setTypingText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)

  // Typing effect logic (simplified for brevity)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentPhrase = typingPhrases[phraseIndex]
      if (typingText.length < currentPhrase.length) {
        setTypingText(currentPhrase.slice(0, typingText.length + 1))
      } else {
        setPhraseIndex((prevIndex) => (prevIndex + 1) % typingPhrases.length)
        setTypingText('')
      }
    }, 100)

    return () => clearInterval(interval)
  }, [typingText, phraseIndex])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle email submission here
    console.log('Submitted email:', email)
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="SyllabusSync Logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-primary">SyllabusSync</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" asChild><Link href="#features">Features</Link></Button>
            <Button variant="ghost" asChild><Link href="#about">About</Link></Button>
            <Button variant="ghost" asChild><Link href="#contact">Contact</Link></Button>
            <Button variant="default" asChild><Link href="/login">Sign In</Link></Button>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Your AI-Powered Academic Companion</h1>
          <p className="text-xl mb-4 max-w-2xl mx-auto">
            SyllabusSync transforms your academic life with AI-driven scheduling, seamless Google Calendar integration, and personalized study plans.
          </p>
          <div className="text-3xl font-bold h-16 mb-8" aria-live="polite">
            Let SyllabusSync help you <span className="text-primary">{typingText}</span>
            <span className="animate-blink">|</span>
          </div>
          <form onSubmit={handleSubmit} className="flex justify-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mr-2"
              aria-label="Email address"
            />
            <Button type="submit">Get Started</Button>
          </form>
        </section>

        <section id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={<Calendar className="h-12 w-12 text-primary" />}
            title="AI-Powered Scheduling"
            description="Optimize your study schedule with advanced AI analysis of your syllabi and assignments."
          />
          <FeatureCard
            icon={<BookOpen className="h-12 w-12 text-primary" />}
            title="Google Calendar Integration"
            description="Seamlessly sync your academic and personal life in one place."
          />
          <FeatureCard
            icon={<Clock className="h-12 w-12 text-primary" />}
            title="Responsive Design"
            description="Access SyllabusSync on any device with our sleek, user-friendly interface."
          />
          <FeatureCard
            icon={<CheckCircle className="h-12 w-12 text-primary" />}
            title="Meet Every Deadline"
            description="Stay ahead in your academic journey with personalized study sessions and reminders."
          />
        </section>

        <section id="about" className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">About SyllabusSync</h2>
          <p className="max-w-2xl mx-auto">
            SyllabusSync is your AI-powered academic companion, designed to transform the way you manage your academic life. 
            Leveraging cutting-edge artificial intelligence, we personalize your study schedules by integrating seamlessly with Google Calendar. 
            Our system analyzes syllabi and assignment deadlines to predict optimal study sessions, ensuring you stay ahead in your academic journey.
          </p>
        </section>

        <section id="contact" className="text-center">
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="mb-4">Have questions? We're here to help!</p>
          <Button variant="outline" asChild>
            <Link href="mailto:support@syllabussync.com">Email Support</Link>
          </Button>
        </section>
      </main>

      <footer className="bg-secondary text-secondary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} SyllabusSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  )
}