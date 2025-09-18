"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  HelpCircle, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  User,
  Mail,
  Lock
} from "lucide-react"
import { cn } from "@/lib/utils"

// Form alanı wrapper bileşeni
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  hint, 
  children, 
  className 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}

// Gelişmiş input bileşeni
interface AdvancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
  variant?: "default" | "search" | "password"
}

export function AdvancedInput({
  label,
  error,
  hint,
  required = false,
  icon,
  rightIcon,
  onRightIconClick,
  variant = "default",
  className,
  ...props
}: AdvancedInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  
  const isPassword = variant === "password"
  const inputType = isPassword && !showPassword ? "password" : props.type || "text"
  
  const rightIconElement = rightIcon || (isPassword ? (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  ) : null)

  const inputElement = (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <Input
        {...props}
        type={inputType}
        className={cn(
          icon && "pl-10",
          rightIconElement && "pr-10",
          error && "border-red-500 focus:border-red-500",
          variant === "search" && "pl-10",
          className
        )}
      />
      {rightIconElement && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {onRightIconClick ? (
            <button
              type="button"
              onClick={onRightIconClick}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {rightIconElement}
            </button>
          ) : (
            rightIconElement
          )}
        </div>
      )}
    </div>
  )

  if (label) {
    return (
      <FormField label={label} required={required} error={error} hint={hint}>
        {inputElement}
      </FormField>
    )
  }

  return inputElement
}

// Form bölümü bileşeni
interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Form buton grubu bileşeni
interface FormButtonGroupProps {
  primaryAction: {
    label: string
    onClick: (e?: React.FormEvent) => void
    loading?: boolean
    disabled?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: "outline" | "ghost"
  }
  cancelAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function FormButtonGroup({
  primaryAction,
  secondaryAction,
  cancelAction,
  className
}: FormButtonGroupProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {cancelAction && (
        <Button
          type="button"
          variant="outline"
          onClick={cancelAction.onClick}
        >
          {cancelAction.label}
        </Button>
      )}
      {secondaryAction && (
        <Button
          type="button"
          variant={secondaryAction.variant || "outline"}
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.label}
        </Button>
      )}
      <Button
        type="button"
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled || primaryAction.loading}
      >
        {primaryAction.loading ? "Yükleniyor..." : primaryAction.label}
      </Button>
    </div>
  )
}

// Form validasyon mesajı bileşeni
interface FormValidationMessageProps {
  type: "error" | "warning" | "success" | "info"
  message: string
  className?: string
}

export function FormValidationMessage({ 
  type, 
  message, 
  className 
}: FormValidationMessageProps) {
  const icons = {
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />
  }

  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    success: "border-green-200 bg-green-50 text-green-800",
    info: "border-blue-200 bg-blue-50 text-blue-800"
  }

  return (
    <Alert className={cn(styles[type], className)}>
      {icons[type]}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

// Form yardım bileşeni
interface FormHelpProps {
  title: string
  content: string
  children: React.ReactNode
}

export function FormHelp({ title, content, children }: FormHelpProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      {children}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="h-3 w-3" />
        {title}
      </button>
      {isOpen && (
        <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
          {content}
        </div>
      )}
    </div>
  )
}

// Form önizleme bileşeni
interface FormPreviewProps {
  title: string
  data: Record<string, any>
  onEdit?: () => void
  className?: string
}

export function FormPreview({ title, data, onEdit, className }: FormPreviewProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Düzenle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-sm font-medium text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="text-sm">
                {value || <span className="text-muted-foreground">-</span>}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Form adımları bileşeni
interface FormStepsProps {
  steps: Array<{
    id: string
    title: string
    description?: string
    completed?: boolean
    current?: boolean
  }>
  className?: string
}

export function FormSteps({ steps, className }: FormStepsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
            step.completed 
              ? "bg-green-100 text-green-600 border-2 border-green-200"
              : step.current
              ? "bg-primary text-primary-foreground border-2 border-primary"
              : "bg-muted text-muted-foreground border-2 border-muted"
          )}>
            {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
          </div>
          <div className="flex-1">
            <h3 className={cn(
              "font-medium",
              step.completed ? "text-green-600" : step.current ? "text-primary" : "text-muted-foreground"
            )}>
              {step.title}
            </h3>
            {step.description && (
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
