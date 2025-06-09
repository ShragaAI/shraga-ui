import { useCallback, useEffect, useRef, useState } from "react";
import { Chat as ChatType, useAppContext } from "../../contexts/AppContext";
import { useChatContext } from "../../contexts/ChatContext";
import { useThemeContext } from "../../contexts/ThemeContext";
import { ChatMessage } from "./ChatMessage";
import JSONViewer from "./JSONViewer";
import PayloadViewer from "./PayloadViewer";
import ChatLoader from "./ChatLoader";

export interface ChatProps { 
  readOnly?: boolean, 
  chatData?: ChatType
}

export default function Chat({ readOnly = false, chatData }: ChatProps) {
  const { configs } = useAppContext();
  const { selectedChat, chatUpdated, setChatUpdated, isLoadingChat } = useChatContext();
  const { setChatBackground } = useThemeContext();

  const bottomRef = useRef<HTMLDivElement>(null);

  const [trace, setTrace] = useState<Record<string, any> | null>(null);
  const [payload, setPayload] = useState<any>(null);
  const [copied, setCopied] = useState<{ [key: number]: boolean }>({});
  const [expandedMessages, setExpandedMessages] = useState<{
    [key: number]: boolean;
  }>({});

  const setCopiedMessages = useCallback((index: number, copied: boolean) => {
    setCopied((prevState) => ({
      ...prevState,
      [index]: copied,
    }));

    if (copied) {
      setTimeout(() => {
        setCopied((prevState) => ({
          ...prevState,
          [index]: false,
        }));
      }, 3000);
    }
  }, []);

  const toggleMessage = (index: number) => {
    setExpandedMessages((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleTraceClick = useCallback((traceData: Record<string, any>) => {
    setTrace(traceData);
  }, []);

  const handlePayloadClick = useCallback((payloadData: any) => {
    setPayload(payloadData);
  }, []);

  useEffect(() => {
    if (chatUpdated && bottomRef.current && !readOnly) {
      const timer = setTimeout(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
        setChatUpdated(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatUpdated]);

  useEffect(() => {
    if (configs?.background_url) setChatBackground(configs?.background_url);
  }, [configs?.background_url]);

  const chatObject = chatData || selectedChat;

  useEffect(() => {
    if (bottomRef.current && !readOnly && !isLoadingChat && chatObject?.messages.length) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [isLoadingChat, selectedChat?.id]);

  if (isLoadingChat && !readOnly) {
    return <ChatLoader />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 ">
        <div className={`pt-3 px-3 ${readOnly ? "pb-3" : " pb-20"}`}>
          {chatObject?.messages.map((message, index) =>
            <ChatMessage
              key={`${message.msg_id || `msg_${index}`}_${message.text ? message.text.slice(0, 10) : "empty"}`}
              message={message}
              index={index}
              readOnly={readOnly}
              onCopyStateChange={setCopiedMessages}
              onTraceClick={handleTraceClick}
              onPayloadClick={handlePayloadClick}
              onReferenceToggle={toggleMessage}
              expandedReferences={expandedMessages}
              copiedStates={copied}
            />
          )}
        </div>
      </div>
      <JSONViewer
        json={trace ?? {}}
        open={!!trace}
        onClose={() => setTrace(null)}
      />
      <PayloadViewer
        payload={payload}
        open={!!payload}
        onClose={() => setPayload(null)}
      />
      <div ref={bottomRef} />
    </div>
  );
}
