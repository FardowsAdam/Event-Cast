"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { X, Plus, Trash2, Heart, AlertTriangle, Save } from "lucide-react"
import { updateHealthProfile } from "@/lib/user-storage"
import type { UserProfile, HealthCondition, WeatherSensitivity } from "@/lib/types"

interface HealthProfileModalProps {
  user: UserProfile
  isRTL: boolean
  onClose: () => void
  onUpdate: (updatedUser: UserProfile) => void
}

const AVAILABLE_CONDITIONS = [
  { id: "asthma", name: "Asthma", nameAr: "الربو" },
  { id: "allergies", name: "Allergies", nameAr: "الحساسية" },
  { id: "heart", name: "Heart Condition", nameAr: "أمراض القلب" },
  { id: "arthritis", name: "Arthritis", nameAr: "التهاب المفاصل" },
  { id: "migraine", name: "Migraines", nameAr: "الصداع النصفي" },
  { id: "respiratory", name: "Respiratory Issues", nameAr: "مشاكل تنفسية" },
  { id: "skin", name: "Skin Sensitivity", nameAr: "حساسية الجلد" },
]

const SENSITIVITY_TYPES = [
  { type: "heat" as const, name: "Heat", nameAr: "الحرارة" },
  { type: "cold" as const, name: "Cold", nameAr: "البرودة" },
  { type: "humidity" as const, name: "Humidity", nameAr: "الرطوبة" },
  { type: "uv" as const, name: "UV Radiation", nameAr: "الأشعة فوق البنفسجية" },
  { type: "wind" as const, name: "Wind", nameAr: "الرياح" },
  { type: "precipitation" as const, name: "Rain/Snow", nameAr: "المطر/الثلج" },
]

export function HealthProfileModal({ user, isRTL, onClose, onUpdate }: HealthProfileModalProps) {
  const [conditions, setConditions] = useState<HealthCondition[]>(user.healthProfile.conditions)
  const [sensitivities, setSensitivities] = useState<WeatherSensitivity[]>(user.healthProfile.sensitivities)
  const [saved, setSaved] = useState(false)

  const addCondition = (conditionId: string) => {
    const condition = AVAILABLE_CONDITIONS.find((c) => c.id === conditionId)
    if (!condition) return

    const newCondition: HealthCondition = {
      id: crypto.randomUUID(),
      name: condition.name,
      nameAr: condition.nameAr,
      severity: "moderate",
    }

    setConditions([...conditions, newCondition])
  }

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  const updateConditionSeverity = (id: string, severity: "mild" | "moderate" | "severe") => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, severity } : c)))
  }

  const toggleSensitivity = (type: WeatherSensitivity["type"], level: "low" | "medium" | "high") => {
    const existing = sensitivities.find((s) => s.type === type)

    if (existing) {
      if (existing.level === level) {
        // Remove if clicking the same level
        setSensitivities(sensitivities.filter((s) => s.type !== type))
      } else {
        // Update level
        setSensitivities(sensitivities.map((s) => (s.type === type ? { ...s, level } : s)))
      }
    } else {
      // Add new sensitivity
      setSensitivities([...sensitivities, { type, level }])
    }
  }

  const handleSave = () => {
    updateHealthProfile(conditions, sensitivities)
    const updatedUser = { ...user, healthProfile: { conditions, sensitivities } }
    onUpdate(updatedUser)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            {isRTL ? "الملف الصحي" : "Health Profile"}
          </h2>
          <p className="text-muted-foreground">
            {isRTL
              ? "أضف حالاتك الصحية وحساسياتك للحصول على تنبيهات مخصصة"
              : "Add your health conditions and sensitivities for personalized alerts"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Health Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{isRTL ? "الحالات الصحية" : "Health Conditions"}</h3>

            {conditions.length > 0 && (
              <div className="space-y-3">
                {conditions.map((condition) => (
                  <div key={condition.id} className="flex items-center gap-3 p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{isRTL ? condition.nameAr : condition.name}</p>
                      <div className="flex gap-2 mt-2">
                        {(["mild", "moderate", "severe"] as const).map((severity) => (
                          <Button
                            key={severity}
                            size="sm"
                            variant={condition.severity === severity ? "default" : "outline"}
                            onClick={() => updateConditionSeverity(condition.id, severity)}
                          >
                            {severity === "mild"
                              ? isRTL
                                ? "خفيف"
                                : "Mild"
                              : severity === "moderate"
                                ? isRTL
                                  ? "متوسط"
                                  : "Moderate"
                                : isRTL
                                  ? "شديد"
                                  : "Severe"}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeCondition(condition.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>{isRTL ? "إضافة حالة صحية" : "Add Health Condition"}</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_CONDITIONS.filter((ac) => !conditions.some((c) => c.name === ac.name)).map((condition) => (
                  <Button
                    key={condition.id}
                    variant="outline"
                    onClick={() => addCondition(condition.id)}
                    className="justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isRTL ? condition.nameAr : condition.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Weather Sensitivities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{isRTL ? "الحساسية للطقس" : "Weather Sensitivities"}</h3>
            <p className="text-sm text-muted-foreground">
              {isRTL ? "حدد مستوى حساسيتك لكل عامل جوي" : "Select your sensitivity level for each weather factor"}
            </p>

            <div className="space-y-3">
              {SENSITIVITY_TYPES.map((sensitivity) => {
                const current = sensitivities.find((s) => s.type === sensitivity.type)
                return (
                  <div key={sensitivity.type} className="p-4 border border-border rounded-lg">
                    <p className="font-medium mb-3">{isRTL ? sensitivity.nameAr : sensitivity.name}</p>
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as const).map((level) => (
                        <Button
                          key={level}
                          size="sm"
                          variant={current?.level === level ? "default" : "outline"}
                          onClick={() => toggleSensitivity(sensitivity.type, level)}
                          className="flex-1"
                        >
                          {level === "low"
                            ? isRTL
                              ? "منخفض"
                              : "Low"
                            : level === "medium"
                              ? isRTL
                                ? "متوسط"
                                : "Medium"
                              : isRTL
                                ? "عالي"
                                : "High"}
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-500 mb-1">{isRTL ? "كيف يعمل هذا؟" : "How does this work?"}</p>
              <p className="text-muted-foreground">
                {isRTL
                  ? "سنستخدم ملفك الصحي لتخصيص التوصيات وإرسال تنبيهات عندما تكون الظروف الجوية غير مناسبة لحالتك الصحية."
                  : "We'll use your health profile to customize recommendations and send alerts when weather conditions are unfavorable for your health."}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saved ? (isRTL ? "تم الحفظ!" : "Saved!") : isRTL ? "حفظ الملف الصحي" : "Save Health Profile"}
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
