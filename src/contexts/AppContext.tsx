import {
  ReactElement,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import useFetch from "../hooks/useFetch";
import useFlowsWithPreferences from "../hooks/useFlowsWithPreferences";

export type UIConfig = {
  enabled: boolean;
  name: string;
  title: string;
  question_line: string;
  background_url: string;
  bot_icon_url: string;
  sidebar_text: string;
  default_flow: string;
  list_flows: boolean;
  loading_messages: string[];
  input_max_length: number;
  map_icons_url?: string;
  map_api: {
    api_key: string;
    dark_map_id: string;
    light_map_id: string;
  }
};

export type Flow = {
  id: string;
  description: string;
  preferences?: Record<string, any>;
};

type MaxExtraResult = {
  coordinates?: number[];
  risk_level?: string;
  incident_type?: string;
}

export type RetrievalResult = {
  id? : string;
  document_id?: number;
  title: string;
  link?: string;
  description?: string;
  score?: number;
  date?: string;
  extra?: MaxExtraResult;
};

export type Message = {
  text: string;
  msg_type: 'user' | 'system' | 'feedback';
  timestamp?: string;
  position?: number;
  rtl: boolean;
  context?: any;
  allowReply?: boolean;
  error?: boolean;
  trace?: any;
  payload?: any;
  retrieval_results?: RetrievalResult[];
  feedback?: Feedback;
  feedback_text?: string;
};

export type Chat = {
  chat_id?: string;
  id: string;
  user_id?: string;
  draft?: boolean;
  flow: Flow;
  flow_id?: string;
  timestamp: Date;
  messages: Message[];
};

export enum Feedback {
  THUMBS_UP = "thumbs_up",
  THUMBS_DOWN = "thumbs_down",
}

type AppContextData = {
  configs?: UIConfig;
  flows?: Flow[];
  appSection?: string;
  setAppSection?: (section: string) => void;
  headerToolbar: ReactNode | null;
  setHeaderToolbar: React.Dispatch<React.SetStateAction<ReactNode | null>>;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSessionEditorOpen: boolean;
  setIsSessionEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type AppProviderProps = {
  children: ReactElement;
};

export const transformPreferences = (preferences?: Record<string, any>): Record<string, any> => {
  if (!preferences) return {};
  
  return Object.entries(preferences).reduce((result, [key, value]) => {
    if (value && typeof value === 'object' && 'default_value' in value) {
      result[key] = value.default_value;
    }
    return result;
  }, {} as Record<string, any>);
};

const AppContext = createContext<AppContextData | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export default function AppProvider({ children }: AppProviderProps) {
  const { data: flows } = useFlowsWithPreferences();
  const { data: configs } = useFetch<UIConfig>("/api/ui/configs");

  const [appSection, setAppSection] = useState("");
  const [headerToolbar, setHeaderToolbar] = useState<ReactNode | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSessionEditorOpen, setIsSessionEditorOpen] = useState(false);

  useEffect(() => {
    document.title = configs?.title || "Shraga";
  }, [configs?.title]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prevState) => !prevState);
  };

  return (
    <AppContext.Provider
      value={{
        configs,
        flows,
        appSection,
        setAppSection,
        headerToolbar,
        setHeaderToolbar,
        isSidebarOpen,
        toggleSidebar,
        isSettingsOpen,
        setIsSettingsOpen,
        isSessionEditorOpen,
        setIsSessionEditorOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
