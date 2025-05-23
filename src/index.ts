import { Chat } from "./components/index";
import { createRoot } from "./CreateRoot";
import "./globals.css";

import type { ChatProps } from "./components/Chat";

import { useThemeContext } from "./contexts/ThemeContext";
import { useAppContext } from "./contexts/AppContext";
import { useChatContext } from "./contexts/ChatContext";
import ShowReference from "./components/Icons/ShowReference";
import ChatReference from "./components/Chat/ChatReference";
import FeedbackButtons from "./components/Chat/FeedbackButtons";
import JSONViewer from "./components/Chat/JSONViewer";
import PayloadViewer from "./components/Chat/PayloadViewer";
import ChatLoader from "./components/Chat/ChatLoader";
import { isDataEmpty } from "./utils/commonUtils";
import type { Chat as ChatType, Message, RetrievalResult } from "./contexts/AppContext";

export { 
    Chat, 
    createRoot,

    useThemeContext,
    useChatContext,
    useAppContext,

    ShowReference,
    ChatReference,
    FeedbackButtons,
    JSONViewer,
    PayloadViewer,
    ChatLoader,
    isDataEmpty
};
export type { 
    ChatProps,
    ChatType,
    Message,
    RetrievalResult
};