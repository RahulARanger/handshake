import type { Dayjs } from 'dayjs';
import type { optionForDateRange } from '../components/about-test-runs/filter-test-runs';
import dayjs from 'dayjs';

export default function filterEntities(
    entity: { Started: Dayjs },
    dateRange: optionForDateRange[],
) {
    let any = false;
    for (const filter of dateRange) {
        const today = dayjs();
        const thisWeek = today.startOf('week');
        const thisMonth = today.startOf('month');
        const thisYear = today.startOf('year');

        switch (filter) {
            case 'Today': {
                any = entity.Started.isSame(today, 'date');
                break;
            }
            case 'Yesterday': {
                any = entity.Started.isSame(today.subtract(1, 'day'), 'date');
                break;
            }
            case 'This Week': {
                any = entity.Started.isBetween(thisWeek, today, 'date', '[)');
                break;
            }
            case 'Last Week': {
                any = entity.Started.isBetween(
                    thisWeek.subtract(1, 'day').startOf('week'),
                    thisWeek,
                    'date',
                    '[)',
                );
                break;
            }
            case 'This Month': {
                any = entity.Started.isBetween(thisMonth, today, 'date', '[)');
                break;
            }
            case 'Last Month': {
                any = entity.Started.isBetween(
                    thisMonth.subtract(1, 'day').startOf('month'),
                    thisMonth,
                    'date',
                    '[)',
                );
                break;
            }
            case 'This Year': {
                any = entity.Started.isBetween(thisYear, today, 'date', '[)');
                break;
            }
            case 'Oldest': {
                any = entity.Started.isBefore(
                    thisYear.subtract(1, 'day'),
                    'date',
                );
                break;
            }

            default: {
                any = true; // for the oldest
            }
        }
        if (any) return true;
    }
    return any;
}
