import React from 'react';

export interface ChatProps {
  readOnly?: boolean;
  chatData?: any;
}

export interface RetrievalResult {
  title: string;
  text: string;
  link?: string;
  date?: string;
  extra?: Record<string, any>;
}

export interface Message {
  msg_type: string;
  text?: string;
  payload: any;
  retrieval_results?: RetrievalResult[];
  trace?: Record<string, any>;
  error?: boolean;
  rtl?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface Flow {
  id: string;
  description: string;
  preferences?: Record<string, any>;
}

export interface AppContextType {
  configs: any;
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
}

export interface ChatContextType {
  selectedChat: Chat | null;
  submitFeedback: (chatId: string, messageIndex: number, type: string, comment: string) => void;
  chatUpdated: boolean;
  setChatUpdated: (updated: boolean) => void;
  isLoadingChat: boolean;
}

export interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
  setChatBackground: (url: string) => void;
  chatBackground?: string;
}

export const Chat: React.FC<ChatProps>;

export function createRoot(element: HTMLElement, chatCls?: React.FC<ChatProps>): void;

export function useThemeContext(): ThemeContextType;
export function useAppContext(): AppContextType;
export function useChatContext(): ChatContextType;

export const ShowReference: React.FC<{width?: string, height?: string}>;
export const ChatReference: React.FC<{retrievalResults: RetrievalResult[]}>;
export const FeedbackButtons: React.FC<{
  index: number, 
  submitFeedback: ChatContextType['submitFeedback'], 
  chat: Chat, 
  message: Message
}>;
export const JSONViewer: React.FC<{json: any, open: boolean, onClose: () => void}>;
export const PayloadViewer: React.FC<{payload: any, open: boolean, onClose: () => void}>;
export function isDataEmpty(obj: any): boolean;

export type ChatType = Chat;