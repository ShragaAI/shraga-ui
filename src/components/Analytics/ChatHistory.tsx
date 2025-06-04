import React, { useEffect, useRef, useState } from 'react';
import { 
    Accordion, 
    AccordionSummary, 
    AccordionDetails, 
    CircularProgress, 
    Pagination, 
    Button,
    Popover,
    Typography,
    Chip
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAlt from '@mui/icons-material/ThumbDownOffAlt';
import { green, red } from '@mui/material/colors';

import { DialogItem } from './Analytics';
import { useChatContext } from "../../contexts/ChatContext";
import useChatMessages from '../../hooks/useChatMessages';
import { groupDialogsByDate } from "../../utils/formatChatsDate.ts";
import { ChatMessage } from '../Chat/ChatMessage';
import PayloadViewer from "../Chat/PayloadViewer";
import JSONViewer from "../Chat/JSONViewer";

interface ChatHistoryProps {
    isLoading: boolean;
    dialogs: DialogItem[];
    pagesNum: number;
    page: number;
    flows: any[];
    changePage: (event: React.ChangeEvent<unknown>, page: number) => void;
}

export const ChatHistory = ({
    isLoading,
    dialogs,
    pagesNum,
    page,
    flows,
    changePage,
}: ChatHistoryProps) => {
    const { ChatComponent } = useChatContext();
    const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLButtonElement | null>(null);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const listTopRef = useRef<HTMLDivElement>(null);

    const MessageComponent = (ChatComponent as any)?.ChatMessage || ChatMessage;

    const [trace, setTrace] = useState<Record<string, any> | null>(null);
    const [payload, setPayload] = useState<any>(null);

    const [messageStates, setMessageStates] = useState<{
        [key: string]: {
            copied: boolean;
            expandedReferences: boolean;
        }
    }>({});
    
    const { data: fullChatMessages, isLoading: isFullChatLoading } = useChatMessages(selectedChatId);

    const handleMessageCopy = (messageId: string, copied: boolean) => {
        setMessageStates(prev => ({
            ...prev,
            [messageId]: { ...prev[messageId], copied }
        }));
        
        if (copied) {
            setTimeout(() => {
                setMessageStates(prev => ({
                    ...prev,
                    [messageId]: { ...prev[messageId], copied: false }
                }));
            }, 3000);
        }
    };

    const handleReferenceToggle = (messageId: string) => {
        setMessageStates(prev => ({
            ...prev,
            [messageId]: { 
                ...prev[messageId], 
                expandedReferences: !prev[messageId]?.expandedReferences 
            }
        }));
    };

    useEffect(() => {
        if (listTopRef.current) {
            listTopRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }, [page]);

    const handleAccordionChange = (dialogId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedAccordion(isExpanded ? dialogId : false);
    };

    const handleViewFullConversation = (event: React.MouseEvent<HTMLButtonElement>, chatId: string) => {
        setPopoverAnchor(event.currentTarget);
        setSelectedChatId(chatId);
    };

    const handleClosePopover = () => {
        setPopoverAnchor(null);
        setSelectedChatId(null);
    };

    const getBackgroundColor = (dialog: DialogItem) => {
        if (dialog.has_error || !dialog.system_message) {
            return '!bg-yellow-50/80 dark:!bg-yellow-900/10';
        }
        return '!bg-green-50/80 dark:!bg-green-900/10';
    };

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getFlowName = (flowId?: string) => {
        const flow = flows?.find(f => f.id === flowId);
        return flow?.description || flow?.id || 'Unknown Flow';
    };

    const groupedDialogs = groupDialogsByDate(dialogs);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <CircularProgress />
            </div>
        );
    }

    if (dialogs.length === 0) {
        return (
            <div className="text-center p-8">
                <Typography variant="h6" color="textSecondary">
                    No dialog history found
                </Typography>
            </div>
        );
    }

    return (
        <div className="relative p-6 rounded-lg bg-white dark:bg-primary-dk w-full max-w-[768px] space-y-6">
            <div ref={listTopRef} className="absolute -top-4" />
            
            {Object.entries(groupedDialogs).map(([groupTitle, groupDialogs]) => (
                <div key={groupTitle} className="space-y-3">
                    <div className="capitalize font-semibold text-sm px-3 py-2 bg-primary-lt rounded-md dark:bg-primary-dk">
                        {groupTitle}
                    </div>
                    
                    {groupDialogs.map((dialog: DialogItem) => {
                        const messageId = dialog.msg_id;
                        const messageState = messageStates[messageId] || {};
                        
                        return (
                            <Accordion
                                key={messageId}
                                expanded={expandedAccordion === messageId}
                                onChange={handleAccordionChange(messageId)}
                                className={`${getBackgroundColor(dialog)} !shadow-sm border border-light-stone dark:border-light-stone/50`}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls={`${messageId}-content`}
                                    id={`${messageId}-header`}
                                    className="hover:bg-primary-lt/50 dark:hover:bg-opacity-10"
                                    sx={{
                                        '& .Mui-expanded': {
                                            marginTop: '12px !important',
                                            marginBottom: '12px !important'
                                        },
                                    }}
                                >
                                    <div className="flex-1 space-y-2 mr-4">
                                        <div className="text-base font-semibold line-clamp-2 min-h-[2rem]">
                                            {dialog.user_message.text || "Question"}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>{formatDate(dialog.timestamp)}</span>
                                            <Chip 
                                                label={getFlowName(dialog.flow_id)}
                                                size="small"
                                                variant="outlined"
                                            />
                                            
                                            <div className="flex items-center gap-2 ml-2">
                                                <ThumbUpOffAltIcon 
                                                    sx={{ color: dialog.feedback_type && dialog.feedback_type === 'up' ? green[500] : 'inherit' }} 
                                                />
                                                <ThumbDownOffAlt 
                                                    sx={{ color: dialog.feedback_type && dialog.feedback_type === 'down' ? red[500] : 'inherit' }} 
                                                />
                                            </div>
                                            
                                            {dialog.has_error && (
                                                <Chip 
                                                    label="Error"
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </AccordionSummary>
                                
                                <AccordionDetails className="pt-0 !bg-white dark:!bg-primary-dk">
                                    {dialog.system_message ? (
                                        <div>
                                            <div className="border-t">
                                                {MessageComponent ? (
                                                    <div className="scale-95 origin-left -ml-3">
                                                        <MessageComponent
                                                            message={dialog.system_message}
                                                            index={0}
                                                            readOnly={true}
                                                            onCopyStateChange={(_: number, copied: boolean) => handleMessageCopy(messageId, copied)}
                                                            onTraceClick={setTrace}
                                                            onPayloadClick={setPayload}
                                                            onReferenceToggle={() => handleReferenceToggle(messageId)}
                                                            expandedReferences={{ 0: messageState.expandedReferences || false }}
                                                            copiedStates={{ 0: messageState.copied || false }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="p-4 border rounded-lg">
                                                        <p>{dialog.system_message.text}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex justify-end pt-2 border-t">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={(e) => handleViewFullConversation(e, dialog.chat_id)}
                                                >
                                                    View Full Conversation
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-4">
                                            {dialog.has_error ? 'An error occurred processing this message' : 'No response was generated for this message'}
                                        </div>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        )
                    })}
                </div>
            ))}

            {pagesNum > 1 && (
                <div className="py-8 w-full flex justify-center">
                    <Pagination 
                        count={pagesNum} 
                        page={page}
                        variant="outlined" 
                        shape="rounded"
                        onChange={changePage}
                    />
                </div>
            )}

            <Popover
                open={Boolean(popoverAnchor)}
                anchorEl={popoverAnchor}
                onClose={handleClosePopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{
                    sx: {
                        width: '80vw',
                        maxWidth: '800px',
                        height: '80vh',
                        maxHeight: '600px'
                    }
                }}
            >
                <div className="p-4 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <Typography variant="h6">Full Conversation</Typography>
                        <Button onClick={handleClosePopover} size="small">
                            Close
                        </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {isFullChatLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <CircularProgress />
                            </div>
                        ) : fullChatMessages ? (
                            <ChatComponent 
                                readOnly={true} 
                                chatData={{
                                    id: selectedChatId!,
                                    chat_id: selectedChatId!,
                                    timestamp: new Date(),
                                    messages: fullChatMessages,
                                    user_id: '',
                                    flow_id: '',
                                    flow: null as any
                                }}
                            />
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No conversation data available
                            </div>
                        )}
                    </div>
                </div>
            </Popover>

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
        </div>
    );
};