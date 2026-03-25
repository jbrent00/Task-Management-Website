import tasks from "../data/mockTasks";

export const getTasks = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(tasks);
    }, 500); // simulate network delay
  });
};