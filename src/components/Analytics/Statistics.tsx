import useSWR from "swr";
import dayjs, { Dayjs } from "dayjs";

import { getAuthCookie } from "../../utils/auth";
import { fetcher } from "../../hooks/useFetch";

import { LineChart } from '@mui/x-charts/LineChart';
import { CurveType } from '@mui/x-charts/models';
import { CircularProgress, Typography, Box } from "@mui/material";

interface DailyStats {
    date: string;
    latency: Record<string, number>;
    input_tokens: Record<string, number>;
    output_tokens: Record<string, number>;
    time_took: Record<string, number>;
}

interface OverallStats {
    total_chats: number;
    total_users: number;
    total_messages: {
        user: number;
        assistant: number;
    };
}

type AnalyticsData = {
    daily: DailyStats[];
    overall: OverallStats;
};

interface TimeSeriesChartProps {
    data: DailyStats[];
    metricKey: 'latency' | 'input_tokens' | 'output_tokens' | 'time_took';
    title: string;
    percentiles: string[];
    colors: string[];
    yAxisTitle: string;
}

const StatOverview = ({ stats }: { stats: OverallStats }) => {
    return (
        <div className="flex flex-col gap-6 py-6 rounded-lg mb-8 dark:bg-secondary-dk">
            <Typography variant="h5" className="mb-4 px-2">
                Overall
            </Typography>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                gap: 4, 
                justifyContent: 'space-between' 
            }}>
                <Box className="text-center" sx={{ flex: 1 }}>
                    <Typography variant="h3" className="font-bold text-primary">
                        {stats.total_chats}
                    </Typography>
                    <Typography variant="subtitle1">Conversations</Typography>
                </Box>
                <Box className="text-center" sx={{ flex: 1 }}>
                    <Typography variant="h3" className="font-bold text-primary">
                        {stats.total_users}
                    </Typography>
                    <Typography variant="subtitle1">Users</Typography>
                </Box>
                <Box className="text-center" sx={{ flex: 1 }}>
                    <Typography variant="h3" className="font-bold text-primary">
                        {stats.total_messages.user + stats.total_messages.assistant}
                    </Typography>
                    <Typography variant="subtitle1">
                        Messages
                    </Typography>
                </Box>
            </Box>
        </div>
    );
};
  

const TimeSeriesChart = ({ data, metricKey, title, percentiles, colors, yAxisTitle } : TimeSeriesChartProps) => {
    if (!data || !data.length) return null;

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const xAxisData = sortedData.map(item => item.date);
    
    const chartSeries = percentiles.map((percentile, index) => {
        const seriesData = sortedData.map(item => {
            if (item[metricKey] && typeof item[metricKey][percentile] === 'number') {
                return item[metricKey][percentile];
            }
            return null;
        });
        
        return {
            id: `percentile-${percentile}`,
            label: `${percentile} percentile`,
            curve: 'linear' as CurveType,
            data: seriesData,
            color: colors[index % colors.length],
        };
    });

    return (
        <div className="mb-8 dark:bg-secondary-dk">
            <Typography variant="h6" className="mb-4 px-2">
                {title}
            </Typography>
            <LineChart
                height={300}
                series={chartSeries}
                slotProps={{
                    legend: {
                        hidden: true
                    }
                }}
                xAxis={[{
                    dataKey: 'date',
                    data: xAxisData,
                    valueFormatter: (value) => dayjs(value).format('MMM D'),
                    scaleType: 'point',
                    tickLabelStyle: {
                        angle: 290,
                        textAnchor: 'end',
                        fontSize: 13,
                    },
                }]}
                yAxis={[{
                    id: "values",
                    label: yAxisTitle,
                    labelStyle: {
                        transform: `rotate(270deg) translate(-80px, -175px)`
                    },
                }]}
                margin={{ 
                    left: 70,
                    right: 20,
                    top: 20,
                    bottom: 80 
                }}
            />
        </div>
    );
};

export const Statistics = ({ startDate, endDate }: { startDate: Dayjs | null; endDate: Dayjs | null }) => {

    const headers = {
        "Content-Type": "application/json",
        "Authorization": getAuthCookie() || ""
    };

    const { data, isLoading } = useSWR(
        ["chat_analytics", startDate, endDate],
        async ([_, start, end]) => {
            const params: { start?: string; end?: string } = {};
            if (start) params.start = (start as Dayjs).format('YYYY-MM-DD');
            if (end) params.end = (end as Dayjs).format('YYYY-MM-DD');

            const data: AnalyticsData = await fetcher(`/api/analytics/`, {
                headers, 
                method: "POST", 
                body: JSON.stringify(params)    
            });

            return data;
        }
    );

    const selectedPercentiles = ["50.0", "90.0", "99.0"];
    const colors = ["#1976d2", "#8884d8", "#ff6384"];

    if (isLoading || !data) {
        return (
            <div className="p-6 rounded-lg bg-white w-full grow space-y-6 dark:bg-primary-dk min-w-[768px]">
                <div className="flex flex-col gap-y-16">
                    <CircularProgress />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-lg bg-white w-full grow space-y-8 dark:bg-primary-dk min-w-[768px]">
            <StatOverview stats={data.overall} />

            <TimeSeriesChart 
                data={data.daily} 
                metricKey="latency" 
                title="Latency"
                percentiles={selectedPercentiles}
                colors={colors}
                yAxisTitle="Latency (ms)"
            />
            
            <TimeSeriesChart 
                data={data.daily} 
                metricKey="input_tokens" 
                title="Input Tokens"
                percentiles={selectedPercentiles}
                colors={colors}
                yAxisTitle="Tokens"
            />
            
            <TimeSeriesChart 
                data={data.daily} 
                metricKey="output_tokens" 
                title="Output Tokens"
                percentiles={selectedPercentiles}
                colors={colors}
                yAxisTitle="Tokens"
            />
            
            <TimeSeriesChart 
                data={data.daily} 
                metricKey="time_took" 
                title="Processing Time"
                percentiles={selectedPercentiles}
                colors={colors}
                yAxisTitle="Time (seconds)"
            />
        </div>
    );
};