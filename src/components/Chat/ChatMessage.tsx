import { memo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import classNames from "classnames";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DataObjectOutlinedIcon from "@mui/icons-material/DataObjectOutlined";
import { Button } from "@mui/material";
import { green } from "@mui/material/colors";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { ChatReference, Message, ShowReference, isDataEmpty, useAppContext } from "../..";
import FeedbackButtons from "./FeedbackButtons";
import { useChatContext } from "../../contexts/ChatContext";

export interface ChatMessageProps {
    message: Message;
    index: number;
    readOnly?: boolean;
    onCopyStateChange?: (index: number, copied: boolean) => void;
    onTraceClick?: (trace: any) => void;
    onPayloadClick?: (payload: any) => void;
    onReferenceToggle?: (index: number) => void;
    expandedReferences?: { [key: number]: boolean };
    copiedStates?: { [key: number]: boolean };
}

export const ChatMessage = memo(({ 
    message, 
    index, 
    readOnly = false,
    onCopyStateChange,
    onTraceClick,
    onPayloadClick,
    onReferenceToggle,
    expandedReferences = {},
    copiedStates = {},
}: ChatMessageProps) => {
    const { configs } = useAppContext();
    const { selectedChat, submitFeedback } = useChatContext();

    const handleCopy = useCallback(() => {
        onCopyStateChange?.(index, true);
    }, [index, onCopyStateChange]);

    const handleTraceClick = useCallback(() => {
        onTraceClick?.(message.trace ?? {});
    }, [message.trace, onTraceClick]);

    const handlePayloadClick = useCallback(() => {
        onPayloadClick?.(message.payload);
    }, [message.payload, onPayloadClick]);

    const handleReferenceToggle = useCallback(() => {
        onReferenceToggle?.(index);
    }, [index, onReferenceToggle]);

    if (message.msg_type === "system") {
        return (
            <div className="chat-message flex-col px-3">
                <div
                    className={classNames(
                        "flex gap-2 p-2 mb-2 rounded-xl",
                        {
                            "bg-white dark:bg-[#2e2e2e]": !readOnly,
                            "bg-primary-lt dark:bg-[#2e2e2e]": readOnly,
                            "border border-red-500": message.error,
                        }
                    )}
                >
                    <div
                        className={classNames("flex mt-2 ml-1.5", {
                            "!text-red-500": message.error,
                        })}
                    >
                        {configs?.bot_icon_url ? (
                            <img
                                src={configs?.bot_icon_url}
                                alt="Custom Icon"
                                className="w-6 h-6"
                            />
                        ) : (
                            <SmartToyIcon />
                        )}
                    </div>
                    <div dir="auto" className="flex-1 p-2 w-full overflow-x-auto">
                        <ReactMarkdown
                            className="break-words whitespace-pre-wrap"
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: (props) => (
                                    <a
                                        className="underline underline-offset-4 text-dark-blue dark:text-link-white"
                                        href={props.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {props.children}
                                    </a>
                                ),
                                ul: ({ children }) => (
                                    <ul className="list-disc pl-5 -mt-4 flex flex-col gap-2">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal pl-5 -mt-4 flex flex-col gap-2">{children}</ol>
                                ),
                                li: ({ children }) => (
                                    <li className="">{children}</li>
                                ),
                                table: ({ children }) => (
                                    <table className="table-auto border-collapse border border-gray-300">
                                        {children}
                                    </table>
                                ),
                                th: ({ children }) => (
                                    <th className="border border-gray-300 px-4 py-2">
                                        {children}
                                    </th>
                                ),
                                td: ({ children }) => (
                                    <td className="border border-gray-300 px-4 py-2">
                                        {children}
                                    </td>
                                ),
                            }}
                        >
                            {message.text}
                        </ReactMarkdown>

                        {import.meta.env.DEV && (
                            <div className="flex space-x-2">
                                {!isDataEmpty(message.trace) && (
                                    <div className="pt-2">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<DataObjectOutlinedIcon />}
                                            onClick={handleTraceClick}
                                        >
                                            Trace
                                        </Button>
                                    </div>
                                )}
                                {!isDataEmpty(message.payload) && (
                                    <div className="pt-2">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<DataObjectOutlinedIcon />}
                                            onClick={handlePayloadClick}
                                        >
                                            Payload
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex p-2 mb-2 gap-3 items-center opacity-85 border-t dark:border-t-[#2e2e2e]">
                    {!readOnly && selectedChat && submitFeedback && (
                        <FeedbackButtons
                            index={index}
                            submitFeedback={submitFeedback}
                            chat={selectedChat}
                            message={message}
                        />
                    )}
                    {message.retrieval_results && message.retrieval_results.length > 0 && (
                        <div
                            className={`flex items-center cursor-pointer ${
                                expandedReferences[index] && "text-green-500"
                            }`}
                            onClick={handleReferenceToggle}
                        >
                            <ShowReference width="w-5" height="h-5" />
                            <span className="text-sm ml-2">Show References ({message.retrieval_results.length})</span>
                        </div>
                    )}
                    <CopyToClipboard
                        text={message.text || ""}
                        onCopy={handleCopy}
                    >
                        <div className="flex items-center cursor-pointer">
                            <ContentCopyIcon
                                fontSize="small"
                                sx={{ color: copiedStates[index] ? green[500] : {} }}
                            />
                            {copiedStates[index] ? (
                                <span className="text-green-500 text-sm ml-2">
                                    Copied!
                                </span>
                            ) : (
                                <span className="text-sm ml-2">Copy</span>
                            )}
                        </div>
                    </CopyToClipboard>
                </div>
                {expandedReferences[index] && (
                    <ChatReference retrievalResults={message.retrieval_results || []} />
                )}
            </div>
        );
    } else {
        return (
            <div
                className={classNames("flex mb-2", {
                    "justify-end": !message.rtl,
                    "justify-start": message.rtl,
                })}
            >
                <div
                    dir="auto"
                    className={`max-w-[400px] py-2 px-3 rounded-xl ${readOnly ? "bg-primary-lt dark:bg-[#2e2e2e]" : "bg-white dark:bg-[#2e2e2e]"}`}
                >
                    <ReactMarkdown
                        className="break-words whitespace-pre-wrap"
                        remarkPlugins={[remarkGfm]}
                    >
                        {message.text}
                    </ReactMarkdown>
                </div>
            </div>
        );
    }
}, (prevProps, nextProps) => {
    return (
        prevProps.message === nextProps.message &&
        JSON.stringify(prevProps.expandedReferences) === JSON.stringify(nextProps.expandedReferences) &&
        JSON.stringify(prevProps.copiedStates) === JSON.stringify(nextProps.copiedStates)
    );
});