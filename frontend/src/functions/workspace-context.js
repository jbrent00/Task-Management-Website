import { createContext, useContext } from 'react';

export const WorkspaceOperationsContext = createContext(null);
export const useWorkspaceOperations = () => useContext(WorkspaceOperationsContext);
