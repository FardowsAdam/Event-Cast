"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Heart } from "lucide-react"
import type { UserProfile } from "@/lib/types"

interface UserMenuProps {
  user: UserProfile
  isRTL: boolean
  onOpenProfile: () => void
  onOpenHealth: () => void
  onLogout: () => void
}

export function UserMenu({ user, isRTL, onOpenProfile, onOpenHealth, onLogout }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenProfile}>
          <Settings className="h-4 w-4 mr-2" />
          {isRTL ? "الإعدادات" : "Settings"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenHealth}>
          <Heart className="h-4 w-4 mr-2" />
          {isRTL ? "الملف الصحي" : "Health Profile"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          {isRTL ? "تسجيل الخروج" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
