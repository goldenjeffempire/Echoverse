import { z } from 'zod';

export const WebSocketAuthMessageSchema = z.object({
  type: z.literal('auth'),
  token: z.string().min(1)
});

export const WebSocketJoinRoomSchema = z.object({
  type: z.literal('join_room'),
  roomId: z.string().min(1),
  roomType: z.enum(['community', 'direct_message', 'website', 'custom'])
});

export const WebSocketLeaveRoomSchema = z.object({
  type: z.literal('leave_room'),
  roomId: z.string().min(1)
});

export const WebSocketSendMessageSchema = z.object({
  type: z.literal('send_message'),
  roomId: z.string().min(1),
  content: z.string().min(1).max(10000),
  metadata: z.record(z.any()).optional()
});

export const WebSocketTypingSchema = z.object({
  type: z.literal('typing'),
  roomId: z.string().min(1),
  isTyping: z.boolean()
});

export const WebSocketPingSchema = z.object({
  type: z.literal('ping')
});

export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  WebSocketAuthMessageSchema,
  WebSocketJoinRoomSchema,
  WebSocketLeaveRoomSchema,
  WebSocketSendMessageSchema,
  WebSocketTypingSchema,
  WebSocketPingSchema
]);

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export type WebSocketAuthMessage = z.infer<typeof WebSocketAuthMessageSchema>;
export type WebSocketJoinRoomMessage = z.infer<typeof WebSocketJoinRoomSchema>;
export type WebSocketSendMessage = z.infer<typeof WebSocketSendMessageSchema>;
