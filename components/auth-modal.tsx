"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Mail, User, LogIn, UserPlus } from "lucide-react"
import { createUserProfile, createGuestUser } from "@/lib/user-storage"
import type { UserProfile } from "@/lib/types"

interface AuthModalProps {
  isRTL: boolean
  onClose: () => void
  onAuth: (profile: UserProfile) => void
}

export function AuthModal({ isRTL, onClose, onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("register")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !email.includes("@")) {
      setError(isRTL ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email")
      return
    }

    if (mode === "register" && !name) {
      setError(isRTL ? "يرجى إدخال الاسم" : "Please enter your name")
      return
    }

    // Create user profile
    const profile = createUserProfile(email, name || email.split("@")[0], false)
    onAuth(profile)
  }

  const handleGuestMode = () => {
    const guestProfile = createGuestUser()
    onAuth(guestProfile)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{isRTL ? "مرحباً بك" : "Welcome"}</h2>
          <p className="text-muted-foreground">
            {isRTL ? "سجل الدخول أو أنشئ حساباً جديداً" : "Sign in or create a new account"}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === "register" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("register")}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isRTL ? "تسجيل جديد" : "Register"}
          </Button>
          <Button
            variant={mode === "login" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("login")}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {isRTL ? "تسجيل دخول" : "Login"}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="h-4 w-4 inline mr-2" />
                {isRTL ? "الاسم" : "Name"}
              </Label>
              <Input
                id="name"
                type="text"
                placeholder={isRTL ? "أدخل اسمك" : "Enter your name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="h-4 w-4 inline mr-2" />
              {isRTL ? "البريد الإلكتروني" : "Email"}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={isRTL ? "أدخل بريدك الإلكتروني" : "Enter your email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-lg"
            />
          </div>

          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

          <Button type="submit" className="w-full" size="lg">
            {mode === "register" ? (isRTL ? "إنشاء حساب" : "Create Account") : isRTL ? "تسجيل الدخول" : "Sign In"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{isRTL ? "أو" : "or"}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full bg-transparent" size="lg" onClick={handleGuestMode}>
          {isRTL ? "متابعة كضيف" : "Continue as Guest"}
        </Button>
      </Card>
    </div>
  )
}
