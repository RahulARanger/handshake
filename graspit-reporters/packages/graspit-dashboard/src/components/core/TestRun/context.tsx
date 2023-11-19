import { createContext } from 'react';
import type { ShareToOtherPages } from 'src/types/parsedRecords';

const MetaCallContext = createContext<ShareToOtherPages>({});
export default MetaCallContext;

export const attachmentPrefix = '/Attachments';
