import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Bot, CheckCheck, MessageCircle, RefreshCw, Send, Sparkles, User, UserRound } from 'lucide-react';

interface Chat { patient_phone: string; patient_name: string; message: string; sender: 'user' | 'bot' | 'patient'; timestamp: string }
interface Message extends Chat { id: number }
const API = 'http://localhost:4001/api/whatsapp';

export default function WhatsAppModule() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadChats() {
    try {
      const response = await fetch(`${API}/chats`);
      if (!response.ok) throw new Error('No se pudieron cargar las conversaciones');
      const data = (await response.json()) as Chat[];
      setChats(Array.isArray(data) ? data : []);
      if (!selectedPhone && data[0]) setSelectedPhone(data[0].patient_phone);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error al cargar chats');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadChats();
  }, []);

  useEffect(() => {
    if (!selectedPhone) {
      setMessages([]);
      return;
    }
    async function loadMessages() {
      try {
        const response = await fetch(`${API}/chats/${encodeURIComponent(selectedPhone)}/messages`);
        if (!response.ok) throw new Error('No se pudieron cargar los mensajes');
        const data = (await response.json()) as Message[];
        setMessages(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar mensajes');
      }
    }
    void loadMessages();
  }, [selectedPhone]);

  const selectedChat = useMemo(() => chats.find((chat) => chat.patient_phone === selectedPhone), [chats, selectedPhone]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || !selectedPhone) return;
    try {
      const response = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_phone: selectedPhone,
          patient_name: selectedChat?.patient_name,
          message: draft,
        }),
      });
      if (!response.ok) throw new Error('No se pudo enviar el mensaje');
      const message = (await response.json()) as Message;
      setMessages((current) => [...current, message]);
      setDraft('');
      void loadChats();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Error al enviar mensaje');
    }
  }

  return (
    <section className="mx-auto flex h-[calc(100vh-8.5rem)] w-full max-w-7xl min-w-0 flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <MessageCircle className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Mensajería Clínica Directa</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Centro de WhatsApp</h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Confirmaciones de citas, respuestas automáticas con IA y atención a pacientes.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadChats();
          }}
          aria-label="Actualizar chats"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sincronizar</span>
        </button>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-2.5 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      {/* Main chat window container */}
      <div className="grid min-h-0 flex-1 min-w-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md md:grid-cols-[minmax(280px,0.32fr)_minmax(0,1fr)]">
        {/* Left: Chat list */}
        <aside className="min-h-0 min-w-0 overflow-y-auto border-b border-slate-200 md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-50/30">
          <div className="border-b border-slate-100 p-4 bg-white/80 backdrop-blur-xs sticky top-0 z-10 flex items-center justify-between">
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-wider">Conversaciones Activas</h2>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{chats.length} chats</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-xs font-medium text-slate-400">Cargando conversaciones...</p>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No hay conversaciones de WhatsApp registradas.
              </div>
            ) : (
              chats.map((chat) => {
                const isSelected = selectedPhone === chat.patient_phone;
                const initials = (chat.patient_name || 'Paciente')
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase();

                return (
                  <button
                    key={chat.patient_phone}
                    type="button"
                    onClick={() => setSelectedPhone(chat.patient_phone)}
                    className={`w-full min-w-0 p-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 border-l-4 border-teal-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black text-xs ${
                        isSelected ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {initials || <User className="h-4 w-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="truncate text-xs font-bold text-slate-900">
                            {chat.patient_name || chat.patient_phone}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(chat.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 font-medium leading-tight">
                          {chat.message}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Message history & composer */}
        <main className="flex min-h-0 min-w-0 flex-col bg-slate-50/40">
          {/* Header of active chat */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 bg-white/95 backdrop-blur-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-black text-slate-900 text-sm">
                  {selectedChat?.patient_name || selectedPhone || 'Selecciona un chat'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {selectedPhone || 'WhatsApp Business Cloud'}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/80">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Bot Activo</span>
            </div>
          </div>

          {/* Message timeline */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="py-20 text-center text-xs font-medium text-slate-400">
                Selecciona una conversación del panel izquierdo para ver los mensajes.
              </div>
            ) : (
              messages.map((message) => {
                const isPatient = message.sender === 'patient';
                const isBot = message.sender === 'bot';

                return (
                  <div
                    key={message.id}
                    className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                        isPatient
                          ? 'bg-white text-slate-800 border border-slate-200/80'
                          : isBot
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-200/80'
                            : 'bg-slate-900 text-white'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-extrabold uppercase opacity-75">
                        {isPatient ? (
                          <>
                            <UserRound className="h-3 w-3 text-slate-400" />
                            <span>Paciente</span>
                          </>
                        ) : isBot ? (
                          <>
                            <Bot className="h-3 w-3 text-teal-600" />
                            <span className="text-teal-700">Mantis AI Assistant</span>
                          </>
                        ) : (
                          <>
                            <CheckCheck className="h-3 w-3 text-teal-400" />
                            <span>Clínica Mantis</span>
                          </>
                        )}
                      </div>

                      <p className="font-medium text-xs">{message.message}</p>

                      <div className="mt-1 text-[10px] text-right opacity-60">
                        {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message composer input */}
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 p-3.5 bg-white">
            <input
              disabled={!selectedPhone}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe un mensaje de respuesta para el paciente..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={!selectedPhone || !draft.trim()}
              aria-label="Enviar mensaje de WhatsApp"
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </main>
      </div>
    </section>
  );
}

