import { createContext, useContext } from 'react';

export const TaskMutationContext = createContext(null);
export const useTaskMutation = () => useContext(TaskMutationContext);
