import type { ProjectRole } from '../../generated/prisma/client';
import { canEditProjectTask, type ProjectTaskPolicy } from '../services/projectPolicy';

export const taskInclude = {
    project: { select: { id: true, title: true, archivedAt: true, editorsCanCreateTasks: true, editorsCanAssignOthers: true, editorsCanEditAllTasks: true, editorsCanSelfAssign: true } },
    createdBy: { select: { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } },
    assignee: { select: { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } },
    taskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    projectTaskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    checklistItems: { orderBy: { orderIndex: 'asc' as const } },
} as const;

type TaskWithRelations = {
    projectId: number | null;
    taskTags: Array<{ tag: { id: number; name: string; color: string } }>;
    projectTaskTags: Array<{ tag: { id: number; name: string; color: string } }>;
};

export type TaskCapabilities = { canEdit: boolean; canDelete: boolean; canReorder: boolean; canAssignOthers: boolean; canJoin: boolean; canLeave: boolean };

const editableCapabilities = { canEdit: true, canDelete: true, canReorder: true, canAssignOthers: true, canJoin: false, canLeave: false };

export function getProjectTaskCapabilities(role: ProjectRole, project: ProjectTaskPolicy, task: { createdById: string; assigneeId: string | null }, userId: string): TaskCapabilities {
    const canEdit = canEditProjectTask(role, project, task, userId);
    const active = !project.archivedAt && role !== 'viewer';
    return {
        canEdit,
        canDelete: canEdit,
        canReorder: canEdit,
        canAssignOthers: active && (role === 'owner' || project.editorsCanAssignOthers),
        canJoin: active && task.assigneeId === null && (role === 'owner' || project.editorsCanSelfAssign),
        canLeave: active && task.assigneeId === userId && (role === 'owner' || project.editorsCanSelfAssign),
    };
}

export function serializeTask<T extends TaskWithRelations>(task: T, capabilities: TaskCapabilities | boolean = editableCapabilities) {
    const { taskTags, projectTaskTags, ...taskFields } = task;
    const source = task.projectId ? projectTaskTags : taskTags;
    const resolved = typeof capabilities === 'boolean'
        ? { canEdit: capabilities, canDelete: capabilities, canReorder: capabilities, canAssignOthers: capabilities, canJoin: false, canLeave: false }
        : capabilities;
    return { ...taskFields, tags: source.map(({ tag }) => tag), capabilities: resolved };
}
