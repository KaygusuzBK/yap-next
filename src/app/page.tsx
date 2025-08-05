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
  ExternalLink,
  LogIn,
  UserPlus
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
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
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                <LogIn className="w-5 h-5 mr-2" />
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <UserPlus className="w-5 h-5 mr-2" />
                Kayıt Ol
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
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm">
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

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm">
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

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm">
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

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm">
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

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm">
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

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm">
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
    </div>
  );
}
