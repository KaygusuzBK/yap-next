export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Y</span>
              </div>
              <span className="font-bold text-xl">YAP</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Proje yönetimi ve işbirliği platformu
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Ürün</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Özellikler</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Fiyatlandırma</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Entegrasyonlar</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Şirket</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Kariyer</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">İletişim</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Destek</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Yardım Merkezi</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Dokümantasyon</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Topluluk</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 YAP. Tüm hakları saklıdır.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Gizlilik Politikası
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Kullanım Şartları
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 