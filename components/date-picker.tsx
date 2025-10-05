"use client"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { useState } from "react"

interface DatePickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  isRTL: boolean
}

export function DatePicker({ selectedDate, onDateChange, isRTL }: DatePickerProps) {
  const [selectedTime, setSelectedTime] = useState<string>(
    `${selectedDate.getHours().toString().padStart(2, "0")}:${selectedDate.getMinutes().toString().padStart(2, "0")}`,
  )

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes)
      onDateChange(newDate)
    }
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    const [hours, minutes] = time.split(":").map(Number)
    const newDate = new Date(selectedDate)
    newDate.setHours(hours, minutes)
    onDateChange(newDate)
  }

  return (
    <div className="space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-12 text-base bg-transparent"
          >
            <CalendarIcon className={`h-5 w-5 ${isRTL ? "ml-2" : "mr-2"}`} />
            {format(selectedDate, "PPP", { locale: isRTL ? ar : undefined })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
        </PopoverContent>
      </Popover>

      <div className="space-y-2">
        <Label htmlFor="time-picker" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {isRTL ? "وقت الفعالية" : "Event Time"}
        </Label>
        <Input
          id="time-picker"
          type="time"
          value={selectedTime}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="h-12 text-base"
        />
      </div>
    </div>
  )
}
