"use client"

import { Button } from "@/components/ui/button"
import { Bike, Users, Utensils, Music, Briefcase, Heart } from "lucide-react"

interface EventTypePickerProps {
  selectedType: string
  onTypeChange: (type: string) => void
  isRTL: boolean
}

const eventTypes = [
  { id: "outdoor", icon: Bike, labelAr: "نشاط خارجي", labelEn: "Outdoor Activity" },
  { id: "social", icon: Users, labelAr: "تجمع اجتماعي", labelEn: "Social Gathering" },
  { id: "dining", icon: Utensils, labelAr: "وجبة طعام", labelEn: "Dining" },
  { id: "concert", icon: Music, labelAr: "حفل موسيقي", labelEn: "Concert" },
  { id: "business", icon: Briefcase, labelAr: "اجتماع عمل", labelEn: "Business Meeting" },
  { id: "sports", icon: Heart, labelAr: "رياضة", labelEn: "Sports" },
]

export function EventTypePicker({ selectedType, onTypeChange, isRTL }: EventTypePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {eventTypes.map((type) => {
        const Icon = type.icon
        const isSelected = selectedType === type.id

        return (
          <Button
            key={type.id}
            variant={isSelected ? "default" : "outline"}
            className="h-20 flex flex-col gap-2"
            onClick={() => onTypeChange(type.id)}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm">{isRTL ? type.labelAr : type.labelEn}</span>
          </Button>
        )
      })}
    </div>
  )
}
