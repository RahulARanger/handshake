import dayjs from "dayjs";
import ParseFormat from "dayjs/plugin/customParseFormat";
import Relatively from "dayjs/plugin/relativeTime";

dayjs.extend(ParseFormat);
dayjs.extend(Relatively);

const formattedDateKey = "DD/MM/YYYY HH:mm:ss";
const fileNameFormat = "DD-MM-YYYY_HH-mm-ss";

export default function readDateForKey(date: string): dayjs.Dayjs {
    return dayjs(date, formattedDateKey);
}

export function toFileString(date: dayjs.Dayjs): string {
    return date.format(fileNameFormat);
}

export function fromNow(date: dayjs.Dayjs): string {
    return date.fromNow();
}
