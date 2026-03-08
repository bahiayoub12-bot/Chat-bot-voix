import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ExternalLink, ArrowRight, Sparkles, Eye, EyeOff, Server } from 'lucide-react';

const MODELS = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', icon: '⚡', desc: 'سريع واقتصادي' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', icon: '🧠', desc: 'أقوى وأذكى' },
];

export default function Login() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!apiKey.trim()) {
      setError('يرجى إدخال مفتاح NVIDIA API');
      return;
    }
    if (!apiKey.startsWith('nvapi-')) {
      setError('المفتاح يجب أن يبدأ بـ nvapi-');
      return;
    }

    setLoading(true);
    setError('');

    // اختبار المفتاح
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'مرحبا' }],
          max_tokens: 10,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        setError('مفتاح API غير صالح. تحقق من المفتاح وحاول مرة أخرى');
        setLoading(false);
        return;
      }

      // حفظ الإعدادات
      const settings = {
        apiKey: apiKey.trim(),
        backendUrl: backendUrl.trim(),
        model,
        ttsEnabled: true,
        ttsSpeed: 1,
      };
      localStorage.setItem('jawad_settings', JSON.stringify(settings));
      navigate('/dashboard');

    } catch {
      setError('فشل الاتصال. تحقق من اتصالك بالإنترنت');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white flex items-center justify-center px-4">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-600/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>

        {/* Card */}
        <div className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl mb-4 shadow-2xl shadow-violet-500/30">
              🤖
            </div>
            <h1 className="text-2xl font-black">مرحباً بك في جواد</h1>
            <p className="text-gray-500 text-sm mt-2">أدخل إعداداتك للبدء</p>
          </div>

          <div className="space-y-5">

            {/* API Key */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-violet-200 mb-2">
                <KeyRound className="w-4 h-4 text-violet-400" />
                مفتاح NVIDIA API *
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="nvapi-..."
                  dir="ltr"
                  className="w-full bg-black/40 text-white rounded-xl px-4 py-3 text-sm border border-white/[0.08] focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 placeholder:text-gray-600 font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <a
                href="https://build.nvidia.com/explore/discover"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                احصل على مفتاح مجاني من NVIDIA
              </a>
            </div>

            {/* Backend URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">
                <Server className="w-4 h-4 text-gray-500" />
                رابط الخادم الخلفي (اختياري)
              </label>
              <input
                type="url"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="https://your-app.hf.space/api"
                dir="ltr"
                className="w-full bg-black/40 text-white rounded-xl px-4 py-3 text-sm border border-white/[0.08] focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 placeholder:text-gray-600 font-mono"
              />
              <p className="text-xs text-gray-600 mt-1.5">
                للميزات المتقدمة مثل تحليل الملفات و Piper TTS، تُستضاف على HuggingFace Spaces
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-violet-200 mb-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                نموذج الذكاء الاصطناعي
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      model === m.id
                        ? 'border-violet-500/50 bg-violet-500/10 text-white'
                        : 'border-white/[0.06] text-gray-500 hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="text-xl mb-1">{m.icon}</div>
                    <div className="text-xs font-bold">{m.name}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-purple-600 text-white font-bold text-base hover:shadow-xl hover:shadow-violet-500/25 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'جاري التحقق...' : 'دخول ←'}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-400 transition-colors"
            >
              ← العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
