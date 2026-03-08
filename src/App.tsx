import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Send,
  Settings,
  Trash2,
  Volume2,
  VolumeX,
  X,
  AlertCircle,
  Bot,
  User,
  ExternalLink,
  Sparkles,
  WifiOff,
  KeyRound,
  MessageSquare,
} from "lucide-react";

// ══════════════════════════════════════════════════════════
//  أنواع البيانات
// ══════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface AppConfig {
  apiKey: string;
  model: string;
  ttsEnabled: boolean;
  ttsRate: number;
}

// ══════════════════════════════════════════════════════════
//  الثوابت
// ══════════════════════════════════════════════════════════

const API_URL = "/api/chat";

const MODELS = [
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    icon: "⚡",
    desc: "سريع واقتصادي",
  },
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    icon: "🧠",
    desc: "أقوى وأذكى",
  },
];

const SYSTEM_PROMPT = `أنت مساعد ذكي اسمك جواد. تتحدث العربية بطلاقة وبشكل طبيعي. ردودك مختصرة وواضحة ولا تتجاوز 3 جمل عادةً. أنت ودود ومرح وتستخدم الإيموجي أحياناً لجعل ردودك حيوية. إذا سُئلت عن نفسك، أخبرهم أنك جواد، المساعد الصوتي الذكي الذي يعمل بنموذج Llama من NVIDIA.`;

const MAX_HISTORY = 20;
const CONFIG_KEY = "jawad_bot_config";
const FETCH_TIMEOUT = 30000;

const QUICK_MESSAGES = [
  "👋 مرحبا جواد",
  "🤔 من أنت؟",
  "🌍 ما عاصمة مصر؟",
  "📝 اكتب قصيدة قصيرة",
  "😂 احكيلي نكتة",
  "💡 أعطني نصيحة",
];

const WELCOME_MESSAGE = `مرحباً بك! أنا **جواد** 🤖 مساعدك الصوتي الذكي

🎤 اضغط على زر الميكروفون للتحدث معي بالصوت
⌨️ أو اكتب رسالتك في حقل النص

كيف يمكنني مساعدتك اليوم؟`;

// ══════════════════════════════════════════════════════════
//  أدوات مساعدة
// ══════════════════════════════════════════════════════════

const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const formatTime = (d: Date) =>
  d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

const loadConfig = (): AppConfig => {
  try {
    const s = localStorage.getItem(CONFIG_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      return {
        apiKey: parsed.apiKey || "",
        model: parsed.model || MODELS[0].id,
        ttsEnabled: parsed.ttsEnabled !== false,
        ttsRate: parsed.ttsRate || 1,
      };
    }
  } catch {
    /* يتجاهل الأخطاء */
  }
  return { apiKey: "", model: MODELS[0].id, ttsEnabled: true, ttsRate: 1 };
};

const persistConfig = (c: AppConfig) => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
  } catch {
    /* يتجاهل الأخطاء */
  }
};

/** تحقق من دعم Web Speech API */
const getSpeechRecognitionClass = (): any => {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

/** تنسيق النص مع دعم Bold بسيط */
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ══════════════════════════════════════════════════════════
//  مكوّن الإعدادات
// ══════════════════════════════════════════════════════════

function SettingsModal({
  config,
  onSave,
  onClose,
}: {
  config: AppConfig;
  onSave: (c: AppConfig) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<AppConfig>({ ...config });
  const [showKey, setShowKey] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#13132e] border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-900/30 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─ رأس النافذة ─ */}
        <div className="flex items-center justify-between px-6 py-4 bg-violet-500/5 border-b border-violet-500/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-violet-400" />
            إعدادات جواد
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* ─ مفتاح API ─ */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-violet-200 mb-2.5">
              <KeyRound className="w-4 h-4 text-violet-400" />
              مفتاح NVIDIA API
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={local.apiKey}
                onChange={(e) =>
                  setLocal({ ...local, apiKey: e.target.value.trim() })
                }
                placeholder="nvapi-..."
                className="w-full bg-black/40 text-white rounded-xl px-4 py-3 text-sm border border-violet-500/20 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-600 font-mono"
                dir="ltr"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-violet-400 hover:text-violet-300 font-medium"
              >
                {showKey ? "إخفاء" : "إظهار"}
              </button>
            </div>
            <a
              href="https://build.nvidia.com/explore/discover"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2.5 text-xs text-violet-400 hover:text-violet-300 transition-colors group"
            >
              <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
              احصل على مفتاح مجاني من NVIDIA Build
            </a>
          </div>

          {/* ─ اختيار النموذج ─ */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-violet-200 mb-2.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              نموذج الذكاء الاصطناعي
            </label>
            <div className="grid grid-cols-1 gap-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLocal({ ...local, model: m.id })}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-right ${
                    local.model === m.id
                      ? "bg-violet-600/15 border-violet-500/40 text-white shadow-inner shadow-violet-500/5"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-violet-500/20 hover:text-slate-300"
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-xs opacity-60 mt-0.5">{m.desc}</div>
                  </div>
                  {local.model === m.id && (
                    <div className="w-2.5 h-2.5 bg-violet-400 rounded-full shadow-lg shadow-violet-400/50" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ─ إعدادات الصوت ─ */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-violet-200 mb-2.5">
              <Volume2 className="w-4 h-4 text-violet-400" />
              الصوت (نطق الردود)
            </label>
            <div className="space-y-3">
              <button
                onClick={() =>
                  setLocal({ ...local, ttsEnabled: !local.ttsEnabled })
                }
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  local.ttsEnabled
                    ? "bg-violet-600/15 text-violet-200 border-violet-500/30"
                    : "bg-black/20 text-slate-500 border-white/5"
                }`}
              >
                {local.ttsEnabled ? "🔊 مفعّل" : "🔇 معطّل"}
              </button>
              {local.ttsEnabled && (
                <div className="flex items-center gap-3 px-1">
                  <span className="text-xs text-slate-500 w-8">بطيء</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={local.ttsRate}
                    onChange={(e) =>
                      setLocal({
                        ...local,
                        ttsRate: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-500 w-8">سريع</span>
                  <span className="text-xs text-violet-300 font-mono w-10 text-center bg-violet-500/10 rounded-md py-0.5">
                    {local.ttsRate}x
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─ أزرار الحفظ ─ */}
        <div className="flex gap-3 px-6 py-4 border-t border-violet-500/10 bg-violet-500/5">
          <button
            onClick={() => {
              onSave(local);
              onClose();
            }}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-violet-600/20 active:scale-[0.98]"
          >
            ✓ حفظ الإعدادات
          </button>
          <button
            onClick={onClose}
            className="px-6 text-slate-400 hover:text-white py-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  مكوّن فقاعة الرسالة
// ══════════════════════════════════════════════════════════

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === "system") {
    return (
      <div className="flex justify-center animate-fade-slide-up">
        <div className="bg-white/5 text-slate-400 text-xs text-center px-5 py-2.5 rounded-xl border border-white/5 max-w-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  const isUser = msg.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-start" : "justify-end"} animate-fade-slide-up`}
    >
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div
          className={`flex items-end gap-2 ${isUser ? "flex-row" : "flex-row-reverse"}`}
        >
          {/* الصورة الرمزية */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
              isUser
                ? "bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-300 shadow-blue-500/10"
                : "bg-gradient-to-br from-violet-500/30 to-purple-600/20 text-violet-300 shadow-violet-500/10"
            }`}
          >
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>

          {/* فقاعة الرسالة */}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-gradient-to-l from-blue-600 to-blue-700 text-white rounded-br-sm shadow-lg shadow-blue-600/15"
                : "bg-[#1a1a3a] text-slate-200 rounded-bl-sm border border-violet-500/10 shadow-lg shadow-violet-900/10"
            }`}
          >
            <p className="text-sm leading-[1.8] whitespace-pre-wrap">
              {renderText(msg.content)}
            </p>
            <p
              className={`text-[10px] mt-2 ${isUser ? "text-blue-200/30" : "text-slate-600"}`}
            >
              {formatTime(msg.timestamp)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  مؤشر التفكير
// ══════════════════════════════════════════════════════════

function ThinkingIndicator() {
  return (
    <div className="flex justify-end animate-fade-slide-up">
      <div className="flex items-end gap-2 flex-row-reverse">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 text-violet-300 flex items-center justify-center shadow-lg shadow-violet-500/10">
          <Bot className="w-4 h-4" />
        </div>
        <div className="bg-[#1a1a3a] rounded-2xl rounded-bl-sm px-5 py-3.5 border border-violet-500/10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-violet-300 font-medium">
              ⏳ جواد يفكر
            </span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                  style={{
                    animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  مؤشر الاستماع
// ══════════════════════════════════════════════════════════

function ListeningIndicator({ text }: { text: string }) {
  return (
    <div className="flex justify-start animate-fade-slide-up">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="bg-red-500/10 rounded-2xl rounded-br-sm px-4 py-3 border border-red-500/15">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="flex items-end gap-0.5 h-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-red-400 font-medium">
              جاري الاستماع...
            </span>
          </div>
          {text && (
            <p className="text-sm text-red-200/80 leading-relaxed">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  شاشة الترحيب (عند عدم وجود مفتاح)
// ══════════════════════════════════════════════════════════

function WelcomeScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-slide-up">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-violet-500/30">
          🤖
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-3">
          مرحباً بك في جواد
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          مساعدك الصوتي الذكي الذي يتحدث العربية بطلاقة. يسمع صوتك، يفهم
          كلامك، ويرد عليك بصوت طبيعي.
        </p>
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-600/30 active:scale-[0.97]"
        >
          <KeyRound className="w-4 h-4" />
          أضف مفتاح API للبدء
        </button>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: "🎤", label: "استماع ذكي" },
            { icon: "🧠", label: "Llama 3.1" },
            { icon: "🔊", label: "نطق تلقائي" },
          ].map((f) => (
            <div
              key={f.label}
              className="py-3 px-2 bg-white/5 rounded-xl border border-white/5"
            >
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-[10px] text-slate-500">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  المكوّن الرئيسي
// ══════════════════════════════════════════════════════════

export default function App() {
  // ─── حالة الإعدادات ───
  const [config, setConfig] = useState<AppConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);

  // ─── حالة المحادثة ───
  const [messages, setMessages] = useState<Message[]>([
    {
      id: genId(),
      role: "assistant",
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // ─── حالة الصوت ───
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  // ─── حالة الأخطاء ───
  const [error, setError] = useState<string | null>(null);

  // ─── المراجع ───
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef("");
  const chatHistoryRef = useRef<Array<{ role: string; content: string }>>([]);
  const sendFnRef = useRef<(text: string) => void>(() => {});
  const arabicVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── حفظ الإعدادات تلقائياً ───
  useEffect(() => {
    persistConfig(config);
  }, [config]);

  // ─── التمرير التلقائي لآخر رسالة ───
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isThinking, interimText]);

  // ─── تحميل الصوت العربي ───
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const arabic = voices.find((v) => v.lang.startsWith("ar"));
      if (arabic) arabicVoiceRef.current = arabic;
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // ─── إعداد التعرف على الصوت ───
  useEffect(() => {
    const SRClass = getSpeechRecognitionClass();
    if (!SRClass) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SRClass();
    rec.lang = "ar-SA";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
      accumulatedRef.current = "";
      setInterimText("");
    };

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          accumulatedRef.current += transcript;
        } else {
          interim = transcript;
        }
      }
      setInterimText(accumulatedRef.current + interim);
    };

    rec.onend = () => {
      setIsListening(false);
      const text = accumulatedRef.current.trim();
      accumulatedRef.current = "";
      setInterimText("");
      if (text) {
        sendFnRef.current(text);
      }
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      accumulatedRef.current = "";
      setInterimText("");

      switch (e.error) {
        case "not-allowed":
          setError(
            "🎤 يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح"
          );
          break;
        case "no-speech":
          setError("🤫 لم يُكتشف أي كلام — حاول مرة أخرى");
          break;
        case "network":
          setError("📡 مشكلة في الاتصال — تحقق من الإنترنت");
          break;
        case "aborted":
          // تم إلغاء الاستماع يدوياً - لا نعرض خطأ
          break;
        default:
          setError("⚠️ خطأ في التعرف على الصوت: " + e.error);
      }
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {
        /* يتجاهل */
      }
    };
  }, []);

  // ─── مؤقت أمان للاستماع (30 ثانية كحد أقصى) ───
  useEffect(() => {
    if (isListening) {
      const timeout = setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            /* يتجاهل */
          }
        }
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [isListening]);

  // ─── نطق النص ───
  const speak = useCallback(
    (text: string) => {
      if (!config.ttsEnabled || !("speechSynthesis" in window)) return;

      // إيقاف أي نطق حالي
      window.speechSynthesis.cancel();

      // تنظيف النص من الإيموجي والرموز الخاصة
      const cleanText = text
        .replace(
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu,
          ""
        )
        .replace(/\*\*/g, "")
        .replace(/\n+/g, ". ")
        .trim();

      if (!cleanText) return;

      // تقسيم النص الطويل إلى جمل
      const sentences = cleanText
        .split(/[.،؟!。]+/)
        .filter((s) => s.trim().length > 0);

      sentences.forEach((sentence, index) => {
        const utt = new SpeechSynthesisUtterance(sentence.trim());
        utt.lang = "ar-SA";
        utt.rate = config.ttsRate;
        utt.pitch = 1;

        if (arabicVoiceRef.current) {
          utt.voice = arabicVoiceRef.current;
        }

        if (index === 0) {
          utt.onstart = () => setIsSpeaking(true);
        }
        if (index === sentences.length - 1) {
          utt.onend = () => setIsSpeaking(false);
          utt.onerror = () => setIsSpeaking(false);
        }

        window.speechSynthesis.speak(utt);
      });
    },
    [config.ttsEnabled, config.ttsRate]
  );

  // ─── إيقاف النطق ───
  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // ─── إرسال الرسالة ───
  const sendMessage = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || isThinking) return;

      setError(null);
      setInputText("");
      stopSpeaking();

      // إضافة رسالة المستخدم
      const userMsg: Message = {
        id: genId(),
        role: "user",
        content: msg,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // ─ أوامر خاصة ─
      const normalized = msg.replace(/[؟?!.\s]/g, "").trim();

      // أمر الخروج
      if (
        ["خروج", "exit", "معالسلامة", "باي", "bye"].includes(normalized)
      ) {
        const bye: Message = {
          id: genId(),
          role: "assistant",
          content: "مع السلامة! سعدت بالتحدث معك 👋😊\nأتمنى لك يوماً رائعاً!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, bye]);
        speak(bye.content);
        return;
      }

      // أمر مسح الذاكرة
      if (
        ["مسحالذاكرة", "مسحالمحادثة", "ابدأمنجديد", "clear"].includes(
          normalized
        )
      ) {
        chatHistoryRef.current = [];
        const sys: Message = {
          id: genId(),
          role: "system",
          content: "🗑️ تم مسح ذاكرة المحادثة — سياق جديد",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, sys]);
        return;
      }

      // ─ إرسال للـ API ─
      setIsThinking(true);

      // إلغاء أي طلب سابق
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortRef.current?.abort(),
        FETCH_TIMEOUT
      );

      try {
        // بناء سياق المحادثة
        const context = chatHistoryRef.current.slice(-MAX_HISTORY);
        const apiMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...context,
          { role: "user", content: msg },
        ];

        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 512,
            top_p: 0.9,
          }),
          signal: abortRef.current.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let errText = "";
          if (res.status === 401 || res.status === 403) {
            errText = "🔑 مفتاح API غير صحيح — تحقق من الإعدادات";
          } else if (res.status === 429) {
            errText = "⚠️ تجاوزت الحد اليومي للاستخدام المجاني — حاول لاحقاً";
          } else if (res.status >= 500) {
            errText = "🔧 خطأ في خادم NVIDIA — حاول مرة أخرى لاحقاً";
          } else {
            errText = `❌ خطأ من الخادم (${res.status})`;
          }
          throw new Error(errText);
        }

        const data = await res.json();
        const reply =
          data.choices?.[0]?.message?.content ||
          "عذراً، لم أستطع فهم ذلك. هل يمكنك إعادة صياغة سؤالك؟";

        // تحديث سياق المحادثة
        chatHistoryRef.current.push(
          { role: "user", content: msg },
          { role: "assistant", content: reply }
        );
        if (chatHistoryRef.current.length > MAX_HISTORY * 2) {
          chatHistoryRef.current = chatHistoryRef.current.slice(
            -MAX_HISTORY * 2
          );
        }

        // إضافة رد البوت
        const botMsg: Message = {
          id: genId(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);

        // نطق الرد
        speak(reply);
      } catch (err: any) {
        clearTimeout(timeoutId);

        let errContent: string;
        if (err.name === "AbortError") {
          errContent = "⏱️ انتهت مهلة الانتظار — حاول مرة أخرى";
        } else if (err.message && (
          err.message.startsWith("🔑") ||
          err.message.startsWith("⚠️") ||
          err.message.startsWith("🔧") ||
          err.message.startsWith("❌")
        )) {
          errContent = err.message;
        } else if (!navigator.onLine) {
          errContent = "📡 تحقق من اتصالك بالإنترنت وحاول مرة أخرى";
        } else {
          errContent =
            "❌ حدث خطأ غير متوقع — تأكد من صحة مفتاح API وحاول مرة أخرى";
        }

        setError(errContent);
        const sys: Message = {
          id: genId(),
          role: "system",
          content: errContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, sys]);
      } finally {
        setIsThinking(false);
        abortRef.current = null;
      }
    },
    [isThinking, config.apiKey, config.model, speak, stopSpeaking]
  );

  // ─── تحديث مرجع دالة الإرسال ───
  sendFnRef.current = sendMessage;

  // ─── تبديل الميكروفون ───
  const toggleMic = useCallback(() => {
    if (!recognitionRef.current) {
      setError(
        "🎤 متصفحك لا يدعم التعرف على الصوت — استخدم Google Chrome أو Edge"
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* يتجاهل */
      }
    } else {
      try {
        setError(null);
        recognitionRef.current.start();
      } catch (e: any) {
        if (e.message?.includes("already started")) {
          recognitionRef.current.stop();
        } else {
          console.error("Speech recognition error:", e);
          setError("⚠️ خطأ في بدء الاستماع — حاول مرة أخرى");
        }
      }
    }
  }, [isListening]);

  // ─── مسح المحادثة ───
  const clearChat = useCallback(() => {
    chatHistoryRef.current = [];
    stopSpeaking();
    setError(null);
    setMessages([
      {
        id: genId(),
        role: "system",
        content: "🗑️ تم مسح المحادثة بالكامل",
        timestamp: new Date(),
      },
      {
        id: genId(),
        role: "assistant",
        content:
          "مرحباً من جديد! 👋 كيف يمكنني مساعدتك؟",
        timestamp: new Date(),
      },
    ]);
  }, [stopSpeaking]);

  // ─── معالجة الضغط على Enter ───
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  // ─── إرسال من حقل النص ───
  const handleSend = () => {
    sendMessage(inputText);
  };

  // ─── حسابات العرض ───
  const statusText = isListening
    ? "🎤 جاري الاستماع..."
    : isSpeaking
      ? "🔊 يتحدث..."
      : isThinking
        ? "⏳ يفكر..."
        : "● متصل";

  const statusColor = isListening
    ? "text-red-400"
    : isSpeaking
      ? "text-violet-400"
      : isThinking
        ? "text-amber-400"
        : "text-emerald-400";

  const currentModel = MODELS.find((m) => m.id === config.model);
  const showQuickMessages = messages.length <= 2 && !isThinking;
  const hasApiKey = true;

  // ══════════════════════════════════════════════════════
  //  العرض
  // ══════════════════════════════════════════════════════

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#0f0e24] to-[#0a0a1a] text-white overflow-hidden">
      {/* ─── نافذة الإعدادات ─── */}
      {showSettings && (
        <SettingsModal
          config={config}
          onSave={(newConfig) => {
            setConfig(newConfig);
            if (newConfig.apiKey && !config.apiKey) {
              setError(null);
            }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/*  الرأس                                         */}
      {/* ═══════════════════════════════════════════════ */}
      <header className="flex-shrink-0 glass border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          {/* الهوية */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xl shadow-lg shadow-violet-600/20 transition-transform ${isSpeaking ? "scale-105" : ""}`}
              >
                🤖
              </div>
              <div
                className={`absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f0e24] transition-colors ${
                  isListening
                    ? "bg-red-500 animate-pulse"
                    : isThinking
                      ? "bg-amber-500 animate-pulse"
                      : isSpeaking
                        ? "bg-violet-500 animate-pulse"
                        : "bg-emerald-500"
                }`}
              />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide">
                جواد
              </h1>
              <p
                className={`text-[11px] ${statusColor} transition-colors duration-300`}
              >
                {statusText}
              </p>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex items-center gap-0.5">
            {/* شارة النموذج */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 rounded-lg text-[11px] text-violet-300/70 border border-violet-500/10 ml-2">
              {currentModel?.icon} {currentModel?.name}
            </span>

            {/* زر كتم الصوت */}
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setConfig((c) => ({ ...c, ttsEnabled: !c.ttsEnabled }));
              }}
              className={`p-2.5 rounded-xl transition-all ${
                config.ttsEnabled
                  ? "text-violet-300 hover:bg-violet-500/10"
                  : "text-slate-600 hover:bg-white/5"
              }`}
              title={config.ttsEnabled ? "إيقاف الصوت" : "تفعيل الصوت"}
            >
              {config.ttsEnabled ? (
                <Volume2 className="w-[18px] h-[18px]" />
              ) : (
                <VolumeX className="w-[18px] h-[18px]" />
              )}
            </button>

            {/* زر مسح المحادثة */}
            <button
              onClick={clearChat}
              className="p-2.5 text-slate-500 hover:text-red-400 rounded-xl hover:bg-red-500/5 transition-colors"
              title="مسح المحادثة"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>

            {/* زر الإعدادات */}
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2.5 rounded-xl transition-colors ${
                !hasApiKey
                  ? "text-amber-400 hover:bg-amber-500/10 animate-pulse"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title="الإعدادات"
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════ */}
      {/*  شريط الخطأ / التنبيه                          */}
      {/* ═══════════════════════════════════════════════ */}
      {error && (
        <div className="flex-shrink-0 animate-fade-slide-down">
          <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between bg-red-500/10 border-b border-red-500/15">
            <p className="text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="text-red-400/60 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {!hasApiKey && !error && (
        <div className="flex-shrink-0 animate-fade-slide-down">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setShowSettings(true)}
              className="w-full px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/15 text-xs text-amber-300 flex items-center justify-center gap-2 hover:bg-amber-500/15 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 flex-shrink-0" />
              أضف مفتاح NVIDIA API في الإعدادات للبدء
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/*  منطقة الرسائل                                  */}
      {/* ═══════════════════════════════════════════════ */}
      {!hasApiKey && messages.length <= 1 ? (
        <WelcomeScreen onOpenSettings={() => setShowSettings(true)} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* مؤشر التفكير */}
            {isThinking && <ThinkingIndicator />}

            {/* مؤشر الاستماع */}
            {isListening && <ListeningIndicator text={interimText} />}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/*  الرسائل السريعة                                */}
      {/* ═══════════════════════════════════════════════ */}
      {showQuickMessages && hasApiKey && (
        <div className="flex-shrink-0 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar">
            {QUICK_MESSAGES.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isThinking}
                className="flex-shrink-0 px-3.5 py-1.5 bg-violet-500/8 text-violet-300/80 text-xs rounded-full hover:bg-violet-500/15 transition-all border border-violet-500/10 hover:border-violet-500/25 whitespace-nowrap disabled:opacity-30 active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/*  منطقة الإدخال                                  */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex-shrink-0 glass border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {/* زر الميكروفون */}
            <button
              onClick={toggleMic}
              disabled={isThinking}
              className={`relative flex-shrink-0 p-3 rounded-xl transition-all active:scale-95 ${
                isListening
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-mic-pulse"
                  : speechSupported
                    ? "text-slate-400 hover:text-violet-300 hover:bg-violet-500/10"
                    : "text-slate-700 cursor-not-allowed"
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title={
                !speechSupported
                  ? "غير مدعوم في هذا المتصفح"
                  : isListening
                    ? "إيقاف الاستماع"
                    : "بدء الاستماع"
              }
            >
              <Mic className="w-5 h-5 relative z-10" />
              {isListening && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-300 rounded-full animate-ping" />
              )}
            </button>

            {/* حقل النص */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? "🎤 جاري الاستماع..."
                    : isThinking
                      ? "⏳ انتظر رد جواد..."
                      : "اكتب رسالتك هنا..."
                }
                disabled={isListening || isThinking}
                className="w-full bg-white/5 text-white rounded-xl px-4 py-3 text-sm border border-white/8 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-600 disabled:opacity-40 transition-all"
              />
            </div>

            {/* زر الإرسال */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isThinking || isListening}
              className="flex-shrink-0 p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-all disabled:opacity-15 disabled:cursor-not-allowed shadow-lg shadow-violet-600/15 hover:shadow-violet-500/25 active:scale-95"
            >
              <Send className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* تذييل */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-[10px] text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-2.5 h-2.5" />
              {currentModel?.icon} {currentModel?.name} عبر NVIDIA API
            </p>
            {!speechSupported && (
              <p className="text-[10px] text-amber-700 flex items-center gap-1">
                <WifiOff className="w-2.5 h-2.5" />
                الإدخال الصوتي غير مدعوم
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
