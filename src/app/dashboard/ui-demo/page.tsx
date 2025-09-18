"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader, ListContainer, StatusMessage, SearchAndFilter, StatCard } from "@/components/ui/dashboard-components"
import { EmptyState, EmptyTasks, EmptyProjects, EmptyTeams, EmptySearch } from "@/components/ui/empty-state"
import { ErrorState, NetworkError, NotFoundError, ServerError } from "@/components/ui/error-states"
import { SkeletonList, SkeletonCard, SkeletonTable, SkeletonBoard } from "@/components/ui/loading-states"
import { 
  FormField, 
  FormSection, 
  FormButtonGroup, 
  FormValidationMessage,
  FormHelp,
  AdvancedInput,
  FormPreview,
  FormSteps
} from "@/components/ui/form-components"
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Users, 
  Folder, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff
} from "lucide-react"

export default function UIDemoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [empty, setEmpty] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [filterValue, setFilterValue] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    description: ""
  })

  const simulateLoading = () => {
    setLoading(true)
    setError(null)
    setEmpty(false)
    setTimeout(() => setLoading(false), 2000)
  }

  const simulateError = () => {
    setError(new Error("Demo hata mesajı"))
    setLoading(false)
    setEmpty(false)
  }

  const simulateEmpty = () => {
    setEmpty(true)
    setError(null)
    setLoading(false)
  }

  const reset = () => {
    setLoading(false)
    setError(null)
    setEmpty(false)
    setSearchValue("")
    setFilterValue("")
  }

  return (
    <div className="px-4 py-4 space-y-8">
      <DashboardHeader
        title="UI Bileşenleri Demo"
        description="Yeni UI/UX bileşenlerinin test edildiği sayfa"
        icon={<FileText className="h-6 w-6" />}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "UI Demo" }
        ]}
        actions={
          <div className="flex gap-2">
            <Button onClick={simulateLoading} variant="outline" size="sm">
              Loading
            </Button>
            <Button onClick={simulateError} variant="outline" size="sm">
              Error
            </Button>
            <Button onClick={simulateEmpty} variant="outline" size="sm">
              Empty
            </Button>
            <Button onClick={reset} variant="outline" size="sm">
              Reset
            </Button>
          </div>
        }
      />

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Skeleton List</h4>
            <SkeletonList count={3} />
          </div>
          <div>
            <h4 className="font-medium mb-2">Skeleton Card</h4>
            <SkeletonCard />
          </div>
          <div>
            <h4 className="font-medium mb-2">Skeleton Table</h4>
            <SkeletonTable rows={3} columns={4} />
          </div>
          <div>
            <h4 className="font-medium mb-2">Skeleton Board</h4>
            <SkeletonBoard columns={4} />
          </div>
        </CardContent>
      </Card>

      {/* Error States */}
      <Card>
        <CardHeader>
          <CardTitle>Error States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorState
            title="Genel Hata"
            description="Bu bir genel hata mesajıdır"
            actionLabel="Tekrar Dene"
            onAction={() => console.log("Retry")}
          />
          <NetworkError onRetry={() => console.log("Network retry")} />
          <NotFoundError onBack={() => console.log("Back")} />
          <ServerError onRetry={() => console.log("Server retry")} />
        </CardContent>
      </Card>

      {/* Empty States */}
      <Card>
        <CardHeader>
          <CardTitle>Empty States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmptyState
            title="Genel Boş Durum"
            description="Bu bir genel boş durum mesajıdır"
            actionLabel="Oluştur"
            onAction={() => console.log("Create")}
          />
          <EmptyTasks onCreateTask={() => console.log("Create task")} />
          <EmptyProjects onCreateProject={() => console.log("Create project")} />
          <EmptyTeams onCreateTeam={() => console.log("Create team")} />
          <EmptySearch 
            searchTerm="test" 
            onClearSearch={() => console.log("Clear search")} 
          />
        </CardContent>
      </Card>

      {/* Status Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Status Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusMessage
            type="success"
            title="Başarılı"
            description="İşlem başarıyla tamamlandı"
            action={{ label: "Devam Et", onClick: () => console.log("Continue") }}
          />
          <StatusMessage
            type="error"
            title="Hata"
            description="Bir hata oluştu"
            action={{ label: "Tekrar Dene", onClick: () => console.log("Retry") }}
          />
          <StatusMessage
            type="warning"
            title="Uyarı"
            description="Dikkat edilmesi gereken bir durum"
          />
          <StatusMessage
            type="info"
            title="Bilgi"
            description="Yararlı bir bilgi"
          />
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchAndFilter
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            placeholder="Ara..."
            filters={[
              {
                key: "status",
                label: "Durum",
                value: filterValue,
                onChange: setFilterValue,
                options: [
                  { value: "", label: "Tümü" },
                  { value: "active", label: "Aktif" },
                  { value: "inactive", label: "Pasif" }
                ]
              }
            ]}
            onClearFilters={() => setFilterValue("")}
          />
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Toplam Görev"
          value="24"
          description="Bu ay"
          trend={{ value: 12, label: "geçen aya göre", positive: true }}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title="Tamamlanan"
          value="18"
          description="Bu ay"
          trend={{ value: 8, label: "geçen aya göre", positive: true }}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Bekleyen"
          value="6"
          description="Bu ay"
          trend={{ value: 4, label: "geçen aya göre", positive: false }}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* List Container Demo */}
      <ListContainer
        title="Demo Liste"
        description="Bu bir demo liste konteyneridir"
        loading={loading}
        error={error}
        empty={empty}
        emptyState={<EmptyTasks onCreateTask={() => console.log("Create task")} />}
        onRetry={() => console.log("Retry")}
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ekle
          </Button>
        }
      >
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 border rounded-md">
              <h4 className="font-medium">Demo Öğe {i}</h4>
              <p className="text-sm text-muted-foreground">Demo açıklama</p>
            </div>
          ))}
        </div>
      </ListContainer>

      {/* Form Components */}
      <Card>
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormSection title="Temel Form Alanları" description="Gelişmiş form bileşenleri">
            <FormField
              label="Ad Soyad"
              required
              hint="Tam adınızı girin"
            >
              <AdvancedInput
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Adınızı girin"
                icon={<User className="h-4 w-4" />}
              />
            </FormField>

            <FormField
              label="E-posta"
              required
              hint="Geçerli bir e-posta adresi girin"
            >
              <AdvancedInput
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ornek@email.com"
                icon={<Mail className="h-4 w-4" />}
              />
            </FormField>

            <FormField
              label="Şifre"
              required
              hint="En az 8 karakter olmalıdır"
            >
              <AdvancedInput
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Şifrenizi girin"
                icon={<Lock className="h-4 w-4" />}
              />
            </FormField>

            <FormField
              label="Açıklama"
              hint="İsteğe bağlı açıklama"
            >
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Açıklama girin"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </FormField>
          </FormSection>

          <FormButtonGroup
            primaryAction={{
              label: "Kaydet",
              onClick: () => console.log("Save"),
              loading: false
            }}
            secondaryAction={{
              label: "Taslak Kaydet",
              onClick: () => console.log("Save draft"),
              variant: "outline"
            }}
            cancelAction={{
              label: "İptal",
              onClick: () => console.log("Cancel")
            }}
          />
        </CardContent>
      </Card>

      {/* Form Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Form Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSteps
            steps={[
              {
                id: "step1",
                title: "Bilgileri Gir",
                description: "Temel bilgileri doldurun",
                completed: true
              },
              {
                id: "step2",
                title: "Doğrula",
                description: "Bilgileri kontrol edin",
                current: true
              },
              {
                id: "step3",
                title: "Tamamla",
                description: "İşlemi bitirin"
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* Form Preview */}
      <FormPreview
        title="Form Önizleme"
        data={formData}
        onEdit={() => console.log("Edit")}
      />
    </div>
  )
}
