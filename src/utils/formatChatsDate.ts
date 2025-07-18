import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { Chat } from "../contexts/AppContext.tsx";
import { DialogItem } from "../components/Analytics/Analytics.tsx";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(advancedFormat);

export const groupChatsByDate = (chats: Chat[]) => {
  const categorized: Record<string, Array<Chat>> = {};

  const today = dayjs();
  const startOfYear = today.startOf("year");
  const startOfMonth = today.startOf("month");
  const startOfWeek = today.startOf("week");

  chats.forEach((item: Chat) => {
    const date = dayjs(item.timestamp);

    let category;

    if (date.isSame(today, "day")) {
      category = "Today";
    } else if (date.isSame(today.subtract(1, "day"), "day")) {
      category = "Yesterday";
    } else if (
      date.isAfter(startOfWeek.subtract(1, "week")) &&
      date.isBefore(startOfWeek)
    ) {
      category = "Last Week";
    } else if (
      date.isAfter(startOfMonth.subtract(1, "month")) &&
      date.isBefore(startOfMonth)
    ) {
      category = "Last Month";
    } else if (
      date.isAfter(startOfYear.subtract(1, "year")) &&
      date.isBefore(startOfYear)
    ) {
      category = "Last Year";
    } else if (date.isBefore(startOfYear)) {
      category = "Earlier";
    } else {
      category = date.format("MMMM YYYY");
    }

    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(item);
  });

  return categorized;
};

export const groupDialogsByDate = (dialogs: DialogItem[]): Record<string, DialogItem[]> => {
  return dialogs.reduce((groups: Record<string, DialogItem[]>, dialog) => {
      const date = dayjs(dialog.timestamp);
      const today = dayjs();
      const yesterday = today.subtract(1, 'day');
      
      let key: string;
      if (date.isSame(today, 'day')) {
          key = 'today';
      } else if (date.isSame(yesterday, 'day')) {
          key = 'yesterday';
      } else if (date.isSame(today, 'week')) {
          key = 'this week';
      } else if (date.isSame(today, 'month')) {
          key = 'this month';
      } else {
          key = date.format('MMMM YYYY');
      }
      
      if (!groups[key]) {
          groups[key] = [];
      }
      groups[key].push(dialog);
      return groups;
  }, {});
};
