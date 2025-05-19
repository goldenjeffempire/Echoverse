import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isThinking?: boolean;
};

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Hello! I\'m your Echoverse AI assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    // Create temporary AI thinking message
    const aiThinkingMessage: Message = {
      id: `ai-thinking-${Date.now()}`,
      content: '',
      sender: 'ai',
      timestamp: new Date(),
      isThinking: true,
    };

    // Update messages state with user message and AI thinking indicator
    setMessages((prev) => [...prev, userMessage, aiThinkingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get user role for context
      const userData = localStorage.getItem('user');
      const userRole = userData ? JSON.parse(userData).currentRole || 'general' : 'general';

      // Send message to AI assistant API
      const response = await apiRequest('POST', '/api/chat', {
        message: inputValue,
        context: `User with ${userRole} role`
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get response');
      }

      // Remove thinking message and add actual AI response
      setMessages((prev) => 
        prev.filter((msg) => msg.id !== aiThinkingMessage.id).concat({
          id: `ai-${Date.now()}`,
          content: result.response,
          sender: 'ai',
          timestamp: new Date(),
        })
      );
    } catch (error: any) {
      // Remove thinking message and show error
      setMessages((prev) => 
        prev.filter((msg) => msg.id !== aiThinkingMessage.id).concat({
          id: `ai-error-${Date.now()}`,
          content: "I'm sorry, I encountered an error. Please try again.",
          sender: 'ai',
          timestamp: new Date(),
        })
      );

      toast({
        title: 'Error',
        description: error.message || 'Failed to communicate with AI assistant',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
        <CardDescription>Ask me anything about your projects, tasks, or need help with content.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {message.isThinking ? (
                  <div className="flex space-x-1 items-center">
                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                <div 
                  className={`text-xs mt-1 ${
                    message.sender === 'user' 
                      ? 'text-white/70' 
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 resize-none"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}