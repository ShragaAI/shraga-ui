import AddCircleIcon from "@mui/icons-material/AddCircle";
import classNames from "classnames";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { Chat, Flow, useAppContext, transformPreferences } from "../contexts/AppContext";
import { useChatContext } from "../contexts/ChatContext";
import { groupChatsByDate } from "../utils/formatChatsDate.ts";
import SidebarHeaderControls from "./SidebarHeaderControls";

type SidebarProps = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

export default function Sidebar({
  isSidebarOpen,
  toggleSidebar,
}: SidebarProps) {
  const {
    configs,
    flows,
    setIsSessionEditorOpen,
  } = useAppContext();
  const { createChat, chats, selectedChat, selectChat } = useChatContext();
  const location = useLocation();
  const chatId = location.search.substring(1);

  const handleNewChat = () => {
    if (configs?.list_flows) {
      setIsSessionEditorOpen(true);
    } else {
      const defaultFlow = configs?.default_flow;

      if (Array.isArray(defaultFlow) && defaultFlow.length > 1) {
        setIsSessionEditorOpen(true);
      } else if (chats.length > 0 && flows) {
        const startFlow: Flow = {
          id: chats[0].flow.id,
          description: "",
        };

        if (chats[0].preferences) {
          startFlow.preferences = chats[0].preferences;
        } else {
          const flow = flows.find((flow) => flow.id === startFlow.id);
          if (flow) {
            startFlow.preferences = transformPreferences(flow.preferences);
          }
        }

        createChat(startFlow);
      } else if (defaultFlow !== undefined) {
        const flowId = Array.isArray(defaultFlow)
          ? defaultFlow[0]
          : defaultFlow || "default";

        const simpleFlow: Flow = {
          id: flowId,
          description: "Default Flow",
        };

        const flow = flows?.find((flow) => flow.id === flowId);
        if (flow) {
          simpleFlow.preferences = transformPreferences(flow.preferences);
        }

        createChat(simpleFlow);
      }
    }
  };

  // auto select chat if chatId is provided in query params
  useEffect(() => {
    if (!chatId || !chats || !chats.length) return;

    const chatExists = chats.some((item) => item.id === chatId);
    if (!chatExists) return;

    selectChat(chatId);
  }, [chatId, chats]);

  const nonEmptyChats = chats
    .filter((chat: Chat) => chat.messages.length)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  const groupedChats = groupChatsByDate(nonEmptyChats);

  return (
    <div
      className={classNames(
        "flex flex-col overflow-x-hidden bg-white dark:bg-[#171717] shadow-sm dark:shadow-lg duration-200 overflow-auto",
        {
          "w-[300px]": isSidebarOpen,
          "w-0": !isSidebarOpen,
          visible: isSidebarOpen,
          invisible: !isSidebarOpen,
        }
      )}
    >
      <div className="sticky top-0 py-2 px-2 flex justify-between dark:bg-[#171717]">
        <SidebarHeaderControls
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      </div>
      <button
        className="flex items-center py-4 px-4 rounded-lg cursor-pointer hover:bg-primary-lt dark:hover:bg-primary-dk"
        onClick={handleNewChat}
      >
        <AddCircleIcon />
        <p className="px-2 text-lg font-semibold">New Chat</p>
      </button>
      <div className="flex h-full w-full flex-col gap-3 px-2 py-3 overflow-auto">
        <nav>
          <div className="flex flex-col space-y-0.5">
            {Object.entries(groupedChats).map(([groupTitle, groupList]) => {
              return (
                <ul key={groupTitle}>
                  <div className="capitalize mt-3 mb-4 font-medium font-primary-dk text-sm px-2">
                    {groupTitle}
                  </div>
                  {groupList.map((chatItem: Chat) => {
                    const flow = flows?.find((f) => f.id === chatItem.flow.id);
                    return (
                      <li
                        key={chatItem.id}
                        className={classNames(
                          "my-1 flex justify-between w-full items-center py-3 px-2 rounded-lg cursor-pointer hover:bg-primary-lt dark:hover:bg-primary-dk",
                          {
                            "bg-primary-lt dark:bg-primary-dk":
                              selectedChat?.id === chatItem.id,
                          }
                        )}
                      >
                        <div
                          className="flex-col w-full"
                          onClick={() => selectChat(chatItem.id)}
                        >
                          <div className={`text-base font-semibold line-clamp-2 break-all ${(configs?.list_flows || import.meta.env.DEV) ? "min-h-[3rem] mb-1" : ""}`}>
                            {chatItem.messages?.[0]?.text || "Question"}
                          </div>
                          <p className="text-sm line-clamp-1 text-gray-500">
                            {configs?.list_flows ? flow?.description : ""} {import.meta.env.DEV && (<span>[{chatItem.id.slice(0, 5)}]</span>)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              );
            })}
          </div>
        </nav>
      </div>
      {configs?.sidebar_text && (
        <div className="w-full px-4 py-2 dark:bg-[#171717] border-t dark:border-t-[#2e2e2e]">
          <ReactMarkdown
            className="text-sm text-gray-500"
            remarkPlugins={[remarkGfm]}
          >
            {configs?.sidebar_text.replace(/\\n/g, "\r\n")}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
