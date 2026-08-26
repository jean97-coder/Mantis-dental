import { useState } from 'react';
import { Bot, Check, Copy, Lightbulb, Send, Sparkles } from 'lucide-react';

interface AiMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function MantisAiModule() {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: '¡Hola, Doctor! Soy Mantis AI, tu asistente clínico odontológico. Puedo ayudarte a redactar notas SOAP, sugerir protocolos clínicos para endodoncia/rehabilitación, revisar interacciones farmacológicas o redactar consentimientos informados.',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'Redactar nota SOAP para exodoncia pieza 38',
    'Prescripción y posología amoxicilina + ácido clavulánico',
    'Protocolo de aislamiento absoluto en molar superior',
    'Consentimiento informado para blanqueamiento dental',
  ];

  function handleSend(promptText?: string) {
    const textToSend = promptText || input;
    if (!textToSend.trim()) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Clinical AI response simulator
    setTimeout(() => {
      let aiReply = '';
      const lower = textToSend.toLowerCase();

      if (lower.includes('soap') || lower.includes('38') || lower.includes('exodoncia')) {
        aiReply = `📋 **NOTA DE EVOLUCIÓN (SOAP) - EXODONCIA PIEZA 38**\n\n**S (Subjetivo):** Paciente refiere molestia e inflamación pericoronaria en región molar inferior izquierda.\n**O (Objetivo):** Pieza 38 semi-impactada clase II posición B (Pell & Gregory). Sin presencia de absceso agudo.\n**A (Apreciación):** Pericoronaritis recurrente en pieza 38.\n**P (Plan):**\n1. Asepsia y anestesia infiltrativa/troncular (Articaína 4% con epinefrina 1:100.000).\n2. Incisión marginal y desprendimiento mucoperióstico.\n3. Odontosección y luxación controlada.\n4. Curetaje de lecho alveolar y sutura con seda 3-0.\n5. Indicaciones postoperatorias y receta farmacológica.`;
      } else if (lower.includes('amoxicilina') || lower.includes('posología') || lower.includes('farmac')) {
        aiReply = `💊 **GUÍA FARMACOLÓGICA DENTAL**\n\n**Amoxicilina + Ácido Clavulánico (875/125 mg):**\n- **Dosis en adultos:** 1 comprimido cada 12 horas por 7 días vía oral con alimentos.\n- **Indicaciones:** Infecciones odontogénicas moderadas a severas, celulitis facial, periodontitis agresiva.\n- **Advertencia:** Verificar alergias a betalactámicos. En pacientes alérgicos: evaluar Clindamicina 300 mg c/8h o Azitromicina 500 mg c/24h.`;
      } else if (lower.includes('aislamiento')) {
        aiReply = `🦷 **PROTOCOLO DE AISLAMIENTO ABSOLUTO**\n\n1. Selección del clamp adecuado (ej. W8A, 14A o 56 para molares superiores con poca retención coronal).\n2. Perforación precisa en el dique de goma (grosor medio o pesado).\n3. Colocación de hilo dental de seguridad en el clamp.\n4. Técnica de colocación en 1 tiempo o 2 tiempos.\n5. Sellado gingival con barrera de resina fotopolimerizable (Top Dam) si hay filtración de humedad.\n6. Desinfección del campo con clorhexidina al 2% o hipoclorito de sodio diluido.`;
      } else {
        aiReply = `✨ **Respuesta Clínica Especializada:**\n\nHe analizado tu consulta sobre "${textToSend}". Como recomendación clínica para este procedimiento:\n- Asegurar valoración radiográfica periapical/panorámica previa.\n- Evaluar antecedentes sistémicos en la ficha médica del paciente.\n- Documentar cada etapa en el expediente digital y solicitar firma del consentimiento informado.`;
      }

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  }

  function handleCopy(id: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <Sparkles className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Inteligencia Artificial Especializada</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Mantis AI Assistant</h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Asistencia clínica en diagnóstico, redacción de notas SOAP y farmacología odontológica.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            Modelo Odonto-AI Activo
          </span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-1 min-h-0 flex-col rounded-3xl border border-slate-200/90 bg-white shadow-md overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-3xl p-5 text-xs shadow-xs leading-relaxed ${
                  isAi
                    ? 'bg-white border border-slate-200/90 text-slate-800'
                    : 'bg-teal-700 text-white shadow-teal-700/10'
                }`}>
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100/60">
                    <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider">
                      {isAi ? (
                        <>
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-50 text-teal-600 border border-teal-100">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-teal-700">Mantis AI</span>
                        </>
                      ) : (
                        <span>Tú (Doctor)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] opacity-60">
                      <span>{msg.timestamp}</span>
                      {isAi && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:opacity-100 transition-opacity p-0.5"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Prompts */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex flex-wrap gap-2">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-900 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Lightbulb className="h-3 w-3 text-amber-500" />
              <span>{p}</span>
            </button>
          ))}
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-100 bg-white flex gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta a Mantis AI sobre diagnósticos, fármacos, notas SOAP..."
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Consultar</span>
          </button>
        </form>
      </div>
    </section>
  );
}
