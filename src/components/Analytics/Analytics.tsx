import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Button, Tabs, Tab } from "@mui/material";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import { useAppContext, Message } from "../../contexts/AppContext";
import useFetch from "../../hooks/useFetch";
import { ChatHistory } from "./ChatHistory";
import { Statistics } from "./Statistics";

dayjs.extend(isBetween);

interface AnalyticsMessage extends Omit<Message, 'msg_type'> {
    chat_id: string;
    user_id: string;
    flow_id: string;
    timestamp: string;
    msg_type: 'user' | 'system' | 'feedback' | 'error';
}

export interface DialogItem {
    msg_id: string;
    chat_id: string;
    user_id: string;
    flow_id?: string;
    timestamp: string;
    user_message: AnalyticsMessage;
    system_message?: AnalyticsMessage;
    has_error: boolean;
    feedback_type?: 'up' | 'down';
}

interface CustomTabPanelProps {
    children: React.ReactNode;
    value: number;
    index: number;
}
  
export const CustomTabPanel: React.FC<CustomTabPanelProps> = ({ children, value, index }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
        >
            {value === index && <div className="p-3">{children}</div>}
        </div>
    );
};

export default function Analytics() {
    const { flows, setAppSection, setHeaderToolbar } = useAppContext();
    const { fetcher } = useFetch();

    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const itemsPerPage = 20;

    const [tabValue, setTabValue] = useState(() => {
        const savedTab = sessionStorage.getItem('analyticsTab');
        return savedTab ? parseInt(savedTab) : 0;
    });

    useEffect(() => {
        sessionStorage.setItem('analyticsTab', tabValue.toString());
    }, [tabValue]);

    const { data: rawMessages, isLoading } = useSWR(
        ["analytics_chat_history", startDate, endDate],
        async ([_, start, end]) => {
            const params: { start?: string; end?: string } = {};
            if (start) params.start = (start as Dayjs).format('YYYY-MM-DD');
            if (end) params.end = (end as Dayjs).format('YYYY-MM-DD');

            const queryString = new URLSearchParams(params).toString();
            const data = await fetcher(`/api/analytics/chat-dialogs?${queryString}`);
            
            return data;
        }
    );

    const dialogs: DialogItem[] = useMemo(() => {
        if (!rawMessages) return [];
        
        const dialogsMap: Record<string, { user?: AnalyticsMessage, system?: AnalyticsMessage }> = {};
        
        rawMessages.forEach((message: AnalyticsMessage) => {
            const msgId = message.msg_id;
            if (!msgId) return;
            
            if (!dialogsMap[msgId]) {
                dialogsMap[msgId] = {};
            }
            
            if (message.msg_type === 'user') {
                dialogsMap[msgId].user = message;
            } else if (message.msg_type === 'system') {
                dialogsMap[msgId].system = message;
            }
        });
        
        const result: DialogItem[] = [];
        Object.entries(dialogsMap).forEach(([msgId, pair]) => {
            if (pair.user) {
                const dialog: DialogItem = {
                    msg_id: msgId,
                    chat_id: pair.user.chat_id,
                    user_id: pair.user.user_id,
                    flow_id: pair.user.flow_id,
                    timestamp: pair.user.timestamp,
                    user_message: pair.user,
                    system_message: pair.system,
                    has_error: pair.system?.error || false,
                    feedback_type: pair.system?.feedback === 'thumbs_up' ? 'up' : 
                                pair.system?.feedback === 'thumbs_down' ? 'down' : undefined
                };
                result.push(dialog);
            }
        });
        
        return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [rawMessages]);

    useEffect(() => {
        setAppSection?.('Analytics');
        
        const FilterToolbar = () => (
            <div className="flex gap-6 items-center">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={['DatePicker']} sx={{ overflow: 'hidden' }}>
                        <DatePicker 
                            label="Start date" 
                            value={startDate}
                            onChange={setStartDate}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: { width: '150px' }
                                }
                            }}
                        />
                        <DatePicker 
                            label="End date"
                            value={endDate}
                            onChange={setEndDate}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: { width: '150px' }
                                }
                            }}
                        />
                    </DemoContainer>
                </LocalizationProvider>
                <div className="pt-1">
                    <Button variant="contained" onClick={() => { setStartDate(null); setEndDate(null); }}>
                        Clear Filter
                    </Button>
                </div>
            </div>
        );

        setHeaderToolbar?.(<FilterToolbar />);
        return () => setHeaderToolbar?.(null);
    }, [setAppSection, setHeaderToolbar]);

    useEffect(() => {
        setPage(1);
    }, [startDate, endDate]);

    const paginatedDialogs = dialogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const pagesNum = Math.ceil(dialogs.length / itemsPerPage);

    return (
        <div className="space-y-4 flex flex-col pt-24 pb-10 min-h-screen -mt-14 items-center">
            <div className="w-full max-w-[768px] bg-white dark:bg-primary-dk rounded-lg">
                <Tabs 
                    value={tabValue} 
                    onChange={(_, newValue) => setTabValue(newValue)}
                    sx={{
                        '.dark & .MuiTab-root': {
                            color: 'white',
                            transition: 'color 0.3s ease',
                            '&:hover': {
                                color: 'white'
                            },
                            '&.Mui-selected': {
                                color: 'white'
                            },
                            '&.Mui-disabled': {
                                color: 'white'
                            }
                        },
                        '.dark & .MuiTabs-indicator': {
                            backgroundColor: 'white',
                            height: 'white'
                        }
                    }}
                >
                    <Tab label="Statistics" id="tab-0" aria-controls="tabpanel-0" />
                    <Tab label="Chat History" id="tab-1" aria-controls="tabpanel-1" />
                </Tabs>
            </div>

            <CustomTabPanel value={tabValue} index={1}>
                <ChatHistory
                    isLoading={isLoading}
                    dialogs={paginatedDialogs}
                    pagesNum={pagesNum}
                    page={page}
                    flows={flows || []}
                    changePage={(_: React.ChangeEvent<unknown>, newPage: number) => setPage(newPage)}
                />
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={0}>
                <Statistics
                    startDate={startDate}
                    endDate={endDate}
                />
            </CustomTabPanel>
        </div>
    );
}