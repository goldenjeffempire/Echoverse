import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Search, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useWebSocketReconnect } from '@/hooks/useWebSocketReconnect';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
export function RealTimeChat({ roomId, currentUser, recipientUser, className }) {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef();
    const { isConnected, sendMessage: wsSend } = useWebSocketReconnect({
        onMessage: handleWebSocketMessage,
        reconnectInterval: 3000,
    });
    function handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'message':
                    addMessage(data.message);
                    break;
                case 'typing_start':
                    setTypingUsers(prev => new Set(prev).add(data.userId));
                    break;
                case 'typing_stop':
                    setTypingUsers(prev => {
                        const next = new Set(prev);
                        next.delete(data.userId);
                        return next;
                    });
                    break;
                case 'message_read':
                    markMessagesAsRead(data.messageIds);
                    break;
            }
        }
        catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }
    useEffect(() => {
        if (isConnected) {
            wsSend({
                type: 'join_room',
                roomId,
                userId: currentUser.id,
            });
        }
    }, [isConnected, roomId, currentUser.id]);
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const addMessage = (message) => {
        setMessages(prev => [...prev, message]);
    };
    const markMessagesAsRead = (messageIds) => {
        setMessages(prev => prev.map(msg => messageIds.includes(msg.id)
            ? { ...msg, status: 'read' }
            : msg));
    };
    const handleSendMessage = () => {
        if (!messageInput.trim() || !isConnected)
            return;
        const newMessage = {
            id: `temp-${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            content: messageInput,
            timestamp: new Date(),
            type: 'text',
            status: 'sending',
        };
        addMessage(newMessage);
        wsSend({
            type: 'send_message',
            roomId,
            content: messageInput,
            messageType: 'text',
        });
        setMessageInput('');
        handleStopTyping();
    };
    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            wsSend({
                type: 'typing_start',
                roomId,
                userId: currentUser.id,
            });
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(handleStopTyping, 2000);
    };
    const handleStopTyping = () => {
        if (isTyping) {
            setIsTyping(false);
            wsSend({
                type: 'typing_stop',
                roomId,
                userId: currentUser.id,
            });
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const getMessageStatusIcon = (status) => {
        switch (status) {
            case 'sending': return '○';
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '';
        }
    };
    return (<Card className={cn('flex flex-col h-[600px]', className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar>
              <AvatarImage src={recipientUser?.avatar}/>
              <AvatarFallback>
                {recipientUser?.name.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', recipientUser?.status === 'online' ? 'bg-green-500' :
            recipientUser?.status === 'away' ? 'bg-yellow-500' :
                'bg-gray-400')}/>
          </div>
          <div>
            <h3 className="font-semibold">{recipientUser?.name || 'Chat'}</h3>
            <p className="text-sm text-muted-foreground">
              {recipientUser?.status === 'online' ? 'Online' :
            recipientUser?.lastSeen ? `Last seen ${format(recipientUser.lastSeen, 'p')}` :
                'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4"/>
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4"/>
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4"/>
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4"/>
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (<div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800">Reconnecting...</p>
        </div>)}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUser.id;
            const showAvatar = index === 0 ||
                messages[index - 1].senderId !== message.senderId;
            return (<div key={message.id} className={cn('flex gap-3', isOwnMessage ? 'flex-row-reverse' : 'flex-row')}>
                {!isOwnMessage && showAvatar && (<Avatar className="h-8 w-8">
                    <AvatarImage src={message.senderAvatar}/>
                    <AvatarFallback>
                      {message.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>)}
                {!isOwnMessage && !showAvatar && (<div className="w-8"/>)}

                <div className={cn('flex flex-col max-w-[70%]', isOwnMessage ? 'items-end' : 'items-start')}>
                  {showAvatar && !isOwnMessage && (<span className="text-xs text-muted-foreground mb-1">
                      {message.senderName}
                    </span>)}
                  <div className={cn('rounded-lg px-4 py-2', isOwnMessage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted')}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(message.timestamp, 'p')}
                    </span>
                    {isOwnMessage && (<span className={cn('text-xs', message.status === 'read' ? 'text-blue-500' : 'text-muted-foreground')}>
                        {getMessageStatusIcon(message.status)}
                      </span>)}
                  </div>
                </div>
              </div>);
        })}
          
          {/* Typing Indicator */}
          {typingUsers.size > 0 && (<div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {recipientUser?.name.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                </div>
              </div>
            </div>)}
          
          <div ref={messagesEndRef}/>
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-4 w-4"/>
          </Button>
          <div className="flex-1 relative">
            <Input value={messageInput} onChange={(e) => {
            setMessageInput(e.target.value);
            handleTyping();
        }} onKeyPress={handleKeyPress} placeholder="Type a message..." className="pr-10" disabled={!isConnected}/>
            <Button variant="ghost" size="icon" className="absolute right-0 top-0">
              <Smile className="h-4 w-4"/>
            </Button>
          </div>
          <Button onClick={handleSendMessage} disabled={!messageInput.trim() || !isConnected} size="icon">
            <Send className="h-4 w-4"/>
          </Button>
        </div>
      </div>
    </Card>);
}
