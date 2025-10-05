"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Save, User, Mail, Globe, Bell } from "lucide-react"
import { saveUserProfile } from "@/lib/user-storage"
import type { UserProfile } from "@/lib/types"

interface ProfileSettingsModalProps {
  user: UserProfile
  isRTL: boolean
  onClose: () => void
  onUpdate: (updatedUser: UserProfile) => void
}

export function ProfileSettingsModal({ user, isRTL, onClose, onUpdate }: ProfileSettingsModalProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [language, setLanguage] = useState<"ar" | "en">(user.preferences.language)
  const [defaultEventType, setDefaultEventType] = useState(user.preferences.defaultEventType)
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.preferences.notificationsEnabled)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const updatedUser: UserProfile = {
      ...user,
      name,
      email,
      preferences: {
        language,
        defaultEventType,
        notificationsEnabled,
      },
    }

    saveUserProfile(updatedUser)
    onUpdate(updatedUser)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{isRTL ? "إعدادات الحساب" : "Account Settings"}</h2>
          <p className="text-muted-foreground">
            {isRTL ? "قم بتحديث معلومات حسابك وتفضيلاتك" : "Update your account information and preferences"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              {isRTL ? "المعلومات الشخصية" : "Personal Information"}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="name">{isRTL ? "الاسم" : "Name"}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={user.isGuest}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-2" />
                {isRTL ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={user.isGuest}
                className="text-lg"
              />
              {user.isGuest && (
                <p className="text-xs text-muted-foreground">
                  {isRTL ? "قم بإنشاء حساب لتعديل هذه المعلومات" : "Create an account to edit this information"}
                </p>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {isRTL ? "التفضيلات" : "Preferences"}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="language">{isRTL ? "اللغة" : "Language"}</Label>
              <div className="flex gap-2">
                <Button
                  variant={language === "ar" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setLanguage("ar")}
                >
                  العربية
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setLanguage("en")}
                >
                  English
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultEventType">{isRTL ? "نوع الفعالية الافتراضي" : "Default Event Type"}</Label>
              <select
                id="defaultEventType"
                value={defaultEventType}
                onChange={(e) => setDefaultEventType(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
              >
                <option value="">{isRTL ? "لا يوجد" : "None"}</option>
                <option value="outdoor">{isRTL ? "نشاط خارجي" : "Outdoor Activity"}</option>
                <option value="sports">{isRTL ? "رياضة" : "Sports"}</option>
                <option value="wedding">{isRTL ? "زفاف" : "Wedding"}</option>
                <option value="picnic">{isRTL ? "نزهة" : "Picnic"}</option>
                <option value="hiking">{isRTL ? "تسلق" : "Hiking"}</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{isRTL ? "التنبيهات الصحية" : "Health Notifications"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRTL
                      ? "تلقي تنبيهات عند وجود ظروف جوية غير مناسبة"
                      : "Receive alerts for unfavorable weather conditions"}
                  </p>
                </div>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
          </div>

          {/* Account Status */}
          {user.isGuest && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? "أنت تستخدم وضع الضيف. قم بإنشاء حساب للحصول على ميزات إضافية."
                  : "You're using guest mode. Create an account for additional features."}
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saved ? (isRTL ? "تم الحفظ!" : "Saved!") : isRTL ? "حفظ التغييرات" : "Save Changes"}
            </Button>
            <Button onClick={onClose} variant="outline" size="lg">
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
