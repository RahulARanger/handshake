import { createContext } from "react";

const MetaCallContext = createContext<{ port?: string; testID?: string }>({});
export default MetaCallContext;
