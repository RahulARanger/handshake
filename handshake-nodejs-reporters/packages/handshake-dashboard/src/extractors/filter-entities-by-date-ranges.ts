import type { Dayjs } from 'dayjs';
import type { optionForDateRange } from '../components/about-test-runs/filters';
import dayjs from 'dayjs';

export default function filterEntities(
    entity: { Started: Dayjs },
    dateRange: optionForDateRange[],
) {
    let any = false;
    for (const filter of dateRange) {
        const today = dayjs();
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
                any = entity.Started.isBetween(
                    today.startOf('week'),
                    today,
                    'date',
                    '[)',
                );
                break;
            }
            case 'Last Week': {
                any = entity.Started.isBetween(
                    today.startOf('week').subtract(1, 'day').startOf('week'),
                    today,
                    'date',
                    '[)',
                );
                break;
            }
            case 'This Month': {
                any = entity.Started.isBetween(
                    today.startOf('month'),
                    today,
                    'date',
                    '[)',
                );
                break;
            }
            case 'Last Month': {
                any = entity.Started.isBetween(
                    today.startOf('month').subtract(1, 'day').startOf('month'),
                    today,
                    'date',
                    '[)',
                );
                break;
            }
            case 'This Year': {
                any = entity.Started.isBetween(
                    today.startOf('year'),
                    today,
                    'date',
                    '[)',
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
