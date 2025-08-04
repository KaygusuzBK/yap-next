import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Zap, 
  Shield, 
  Code, 
  Palette, 
  Smartphone,
  ArrowRight,
  Github,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">YAP Next</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            <Button size="sm">
              Başla
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Yeni Nesil Web Uygulaması
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Modern Web Deneyimi
              <span className="text-primary block">Next.js ile</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              TypeScript, Tailwind CSS ve modern web teknolojileri ile geliştirilmiş 
              hızlı, güvenli ve ölçeklenebilir web uygulamaları.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                Dashboard&apos;a Git
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <ExternalLink className="w-5 h-5 mr-2" />
              Dokümantasyon
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>TypeScript</CardTitle>
              <CardDescription>
                Tip güvenliği ile daha güvenilir kod yazın ve geliştirme deneyimini artırın.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Tailwind CSS</CardTitle>
              <CardDescription>
                Utility-first CSS framework ile hızlı ve tutarlı tasarım geliştirin.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Responsive</CardTitle>
              <CardDescription>
                Tüm cihazlarda mükemmel görünüm için responsive tasarım.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Hızlı</CardTitle>
              <CardDescription>
                Next.js optimizasyonları ile lightning-fast performans.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Güvenli</CardTitle>
              <CardDescription>
                Modern güvenlik standartları ile korunan uygulamalar.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Ölçeklenebilir</CardTitle>
              <CardDescription>
                Büyüyen ihtiyaçlarınızı karşılayacak esnek mimari.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-32 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">YAP Next</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Hakkında</a>
            <a href="#" className="hover:text-foreground transition-colors">Dokümantasyon</a>
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">İletişim</a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2024 YAP Next. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}
