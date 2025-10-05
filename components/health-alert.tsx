"use client"

import { Card } from "@/components/ui/card"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface HealthAlertProps {
  alerts: string[]
  isRTL: boolean
}

export function HealthAlert({ alerts, isRTL }: HealthAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (alerts.length === 0 || dismissed) return null

  return (
    <Card className="p-4 bg-destructive/10 border-destructive/20 relative">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setDismissed(true)}>
        <X className="h-4 w-4" />
      </Button>

      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-destructive mb-2">{isRTL ? "تحذير صحي" : "Health Alert"}</h3>
          <ul className="space-y-1 text-sm">
            {alerts.map((alert, index) => (
              <li key={index} className="text-foreground">
                • {alert}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
