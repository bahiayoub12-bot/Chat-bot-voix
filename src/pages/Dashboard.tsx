import { useNavigate } from 'react-router-dom';
import { MessageSquare, Settings, LogOut, Sparkles, Clock, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const settingsRaw = localStorage.getItem('jawad_settings');
  const settings = settingsRaw ? JSON.parse(settingsRaw) : null;

  const messagesRaw = localStorage.getItem('jawad_chat_messages');
  const messages = messagesRaw ? JSON.parse(messagesRaw) : [];

  const model = settings?.model?.includes('70b') ? 'Llama 3.1 70B 🧠' : 'Llama 3.1 8B ⚡';

  const handleLogout = () => {
    localStorage.removeItem('jawad_settings');
    localStorage.removeItem('jawad_chat_messages');
    navigate('/login');
  };

  const clearHistory = () => {
    localStorage.removeItem('jawad_chat_messages');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-600/[0.03] blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg">
            🤖
          </div>
          <span className="font-bold">جواد</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2">لوحة التحكم</h1>
          <p className="text-gray-500">مرحباً! جواد جاهز لمساعدتك.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
            <div className="text-2xl font-black text-violet-400">{messages.length}</div>
            <div className="text-xs text-gray-600 mt-1">رسالة محفوظة</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
            <div className="text-sm font-black text-amber-400">{model.split(' ')[2]}</div>
            <div className="text-xs text-gray-600 mt-1">النموذج الحالي</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
            <div className="text-2xl font-black text-green-400">●</div>
            <div className="text-xs text-gray-600 mt-1">متصل</div>
          </div>
        </div>

        {/* Main Action */}
        <button
          onClick={() => navigate('/chat')}
          className="w-full p-6 rounded-2xl border border-violet-500/30 bg-violet-500/[0.05] hover:bg-violet-500/10 hover:border-violet-500/50 transition-all group mb-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div className="text-right">
              <div className="text-lg font-black">ابدأ محادثة</div>
              <div className="text-sm text-gray-500 mt-0.5">تحدث مع جواد أو ارفع ملفاتك</div>
            </div>
          </div>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-sm font-bold mb-1">النموذج</div>
            <div className="text-xs text-gray-500">{model}</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <Clock className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="text-sm font-bold mb-1">المحادثات</div>
            <div className="text-xs text-gray-500">{messages.length} رسالة محفوظة</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            مسح سجل المحادثات
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] text-gray-400 text-sm hover:bg-white/[0.05] transition-all"
          >
            <Settings className="w-4 h-4" />
            تغيير الإعدادات
          </button>
        </div>
      </main>
    </div>
  );
}
