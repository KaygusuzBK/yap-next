export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">Y</span>
              </div>
              <span className="text-xl font-bold">YAP</span>
            </div>
            <p className="text-gray-400">
              Modern proje yönetim platformu ile ekiplerinizi bir araya getirin.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Ürün</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Özellikler</a></li>
              <li><a href="#" className="hover:text-white">Fiyatlandırma</a></li>
              <li><a href="#" className="hover:text-white">Entegrasyonlar</a></li>
              <li><a href="#" className="hover:text-white">API</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Şirket</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Kariyer</a></li>
              <li><a href="#" className="hover:text-white">İletişim</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Destek</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Yardım Merkezi</a></li>
              <li><a href="#" className="hover:text-white">Dokümantasyon</a></li>
              <li><a href="#" className="hover:text-white">Topluluk</a></li>
              <li><a href="#" className="hover:text-white">Durum</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 YAP. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
