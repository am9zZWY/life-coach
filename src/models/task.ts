// types.ts
export interface Task {
    id: string; // Added for uniquely identifying tasks
    title: string;
    description?: string;
    createdDate: Date;
    dueDate?: Date;
    priority: number; // 1-5 where 5 is highest priority
    completed: boolean; // Added to track completion status
    subTasks: Task[];
}

// Optional: Priority enum for better type safety
export enum Priority {
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4,
    Critical = 5
}
