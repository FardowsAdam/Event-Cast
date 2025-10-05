'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        data-slot="progress-indicator"
        className="bg-primary h-full"
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
