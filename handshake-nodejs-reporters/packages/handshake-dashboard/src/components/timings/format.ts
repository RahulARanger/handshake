import { TEXT } from '@hand-shakes/utils';
import dayjs from 'dayjs';

export const dateTimeFormatUsed = TEXT.dateTimeFormatUsed;
export const dateFormatUsed = TEXT.dateFormatUsed;
export const timeFormatUsed = TEXT.timeFormatUsed;
export const simpleDateFormatUsed = 'MMM Do';

export function localDayjs(date?: string) {
    return dayjs(date).utc().local();
}
