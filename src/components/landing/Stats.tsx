export function LandingStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
        <div className="text-gray-600">Aktif Kullanıcı</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
        <div className="text-gray-600">Tamamlanan Proje</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
        <div className="text-gray-600">Uptime</div>
      </div>
    </div>
  );
}
