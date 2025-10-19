import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            role: "assistant",
            content: "👋 Hello! I'm EchoBot, your AI assistant. I can help you build websites, manage your e-commerce, create content, and answer any questions about the platform. How can I help you today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef(null);
    const { toast } = useToast();
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);
    const handleSend = async () => {
        if (!input.trim() || isLoading)
            return;
        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        try {
            const response = await fetch("/api/ai/chatbot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                },
                credentials: "include",
                body: JSON.stringify({
                    message: input.trim(),
                    context: messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')
                })
            });
            if (!response.ok) {
                throw new Error("Failed to get AI response");
            }
            const data = await response.json();
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "I apologize, but I couldn't generate a response. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        }
        catch (error) {
            console.error("Chatbot error:", error);
            toast({
                title: "Error",
                description: "Failed to get AI response. Please try again.",
                variant: "destructive"
            });
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    return (<>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (<motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="fixed bottom-6 right-6 z-50">
            <Button size="lg" onClick={() => setIsOpen(true)} className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/50 transition-all">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <Sparkles className="w-8 h-8 text-white"/>
              </motion.div>
            </Button>
            
            {/* Notification Badge */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              AI
            </motion.div>
          </motion.div>)}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (<motion.div initial={{ opacity: 0, y: 100, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.8 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed bottom-6 right-6 z-50 w-full max-w-md">
            <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6"/>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">EchoBot</CardTitle>
                      <p className="text-xs text-white/80">Always here to help</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
                    <X className="w-5 h-5"/>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (<motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        {message.role === "assistant" && (<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white"/>
                          </div>)}
                        
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"}`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.role === "user" ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {message.role === "user" && (<div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white"/>
                          </div>)}
                      </motion.div>))}
                    
                    {isLoading && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white"/>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                          <div className="flex gap-2 items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600"/>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Thinking...</p>
                          </div>
                        </div>
                      </motion.div>)}
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex gap-2">
                    <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask me anything..." disabled={isLoading} className="flex-1 bg-white dark:bg-slate-900"/>
                    <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      {isLoading ? (<Loader2 className="w-5 h-5 animate-spin"/>) : (<Send className="w-5 h-5"/>)}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                    Powered by AI • Press Enter to send
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>)}
      </AnimatePresence>
    </>);
}
