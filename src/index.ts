import { Chat } from "./components/index";
import { createRoot } from "./CreateRoot";
import "./globals.css";

import type { ChatProps } from "./components/Chat";

import { useThemeContext } from "./contexts/ThemeContext";
import { useAppContext } from "./contexts/AppContext";
import ShowReference from "./components/Icons/ShowReference";
import ChatReference from "./components/Chat/ChatReference";
import FeedbackButtons from "./components/Chat/FeedbackButtons";
import JSONViewer from "./components/Chat/JSONViewer";
import PayloadViewer from "./components/Chat/PayloadViewer";
import { isDataEmpty } from "./utils/commonUtils";
import type { Chat as ChatType, Message, RetrievalResult } from "./contexts/AppContext";

export { 
    Chat, 
    createRoot,

    useThemeContext,
    useAppContext,

    ShowReference,
    ChatReference,
    FeedbackButtons,
    JSONViewer,
    PayloadViewer,

    isDataEmpty
};
export type { 
    ChatProps,
    ChatType,
    Message,
    RetrievalResult
};