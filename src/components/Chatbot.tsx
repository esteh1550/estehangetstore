import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, User, Bot, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { Message } from '../types';
import { chatWithESA } from '../lib/gemini';
import { CONTACT_INFO } from '../constants';
import { cn } from '../lib/utils';

export default function Chatbot() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('esa_chat_history');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : [
        { role: 'assistant', content: 'Halo Kak! Saya ESA, asisten pribadi ESTEHANGET. Ada yang bisa ESA bantu hari ini?' }
      ];
    } catch (e) {
      return [
        { role: 'assistant', content: 'Halo Kak! Saya ESA, asisten pribadi ESTEHANGET. Ada yang bisa ESA bantu hari ini?' }
      ];
    }
  });
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    localStorage.setItem('esa_chat_history', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearHistory = () => {
    const initialMessage: Message[] = [{ role: 'assistant', content: 'Halo Kak! Saya ESA, asisten pribadi ESTEHANGET. Ada yang bisa ESA bantu hari ini?' }];
    setMessages(initialMessage);
    localStorage.removeItem('esa_chat_history');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithESA([...messages, userMessage]);
      
      // Calculate delay based on response length (human-like typing speed)
      // Base delay 600ms + 15ms per character, max 3.5 seconds
      const typingDelay = Math.min(Math.max(600, response.length * 15), 3500);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setIsLoading(false);
      }, typingDelay);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf Kak, sepertinya ada sedikit kendala koneksi. Bisa coba tanya lagi?' }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] max-w-[calc(100vw-2rem)] h-[500px] bg-bone dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-black dark:bg-white p-4 flex items-center justify-between text-bone dark:text-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-black rounded-full flex items-center justify-center text-black overflow-hidden border border-black/5 dark:border-white/5">
                  <img src={CONTACT_INFO.logo} alt="ESA" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">ESA Assistant</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] opacity-70">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={clearHistory}
                  title="Hapus Riwayat"
                  className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors"
                >
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === 'user' ? "bg-tea-main text-white" : "bg-tea-light text-white"
                  )}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' ? "bg-tea-main text-white rounded-tr-none" : "bg-white dark:bg-black text-black dark:text-white shadow-sm rounded-tl-none border border-black/5 dark:border-white/5"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 mr-auto max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-tea-light text-white flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white dark:bg-black p-4 rounded-2xl rounded-tl-none shadow-sm border border-black/5 dark:border-white/5 flex gap-1 items-center">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-1.5 h-1.5 bg-black/40 dark:bg-white/40 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-black/40 dark:bg-white/40 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-black/40 dark:bg-white/40 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-black border-t border-black/10 dark:border-white/10 flex gap-2">
              <input
                type="text"
                placeholder="Tanya ESA sesuatu..."
                className="flex-1 bg-bone dark:bg-white/5 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all text-black dark:text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-tea-main text-white p-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-tea-main text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative group"
      >
        <MessageSquare size={28} />
        <span className="absolute right-full mr-4 bg-white dark:bg-black text-black dark:text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-black/5 dark:border-white/5">
          Tanya ESA
        </span>
      </motion.button>
    </div>
  );
}
