"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft } from "lucide-react"

type Crumb = {
  label: string
  href?: string
}

type DashboardHeaderProps = {
  title: React.ReactNode
  breadcrumb?: Crumb[]
  actions?: React.ReactNode
  backHref?: string
  meta?: React.ReactNode
}

export default function DashboardHeader({
  title,
  breadcrumb = [],
  actions,
  backHref,
  meta,
}: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <div className="w-full space-y-3">
      {breadcrumb.length > 0 && (
        <section>
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumb.map((c, idx) => {
                const isLast = idx === breadcrumb.length - 1
                return (
                  <React.Fragment key={`${c.label}-${idx}`}>
                    <BreadcrumbItem>
                      {isLast || !c.href ? (
                        <BreadcrumbPage>{c.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </section>
      )}

      <section className="flex items-center justify-between">
        <div className="flex items-start gap-2 min-w-0">
          {backHref && (
            <Button aria-label="Geri" title="Geri" variant="ghost" size="sm" onClick={() => router.push(backHref)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{title}</h1>
            {meta ? <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{meta}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </section>
    </div>
  )
}


