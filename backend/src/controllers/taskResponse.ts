import type { ProjectRole } from '../../generated/prisma/client';
import { canEditProjectTask, type ProjectTaskPolicy } from '../services/projectPolicy';

export const taskInclude = {
    project: { select: { id: true, title: true, archivedAt: true, editorsCanCreateTasks: true, editorsCanAssignOthers: true, editorsCanEditAllTasks: true, editorsCanJoinTasks: true, editorsCanLeaveTasks: true } },
    createdBy: { select: { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } },
    assignments: { include: { user: { select: { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } } }, orderBy: { assignedAt: 'asc' as const } },
    taskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    projectTaskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    checklistItems: { orderBy: { orderIndex: 'asc' as const } },
    _count: { select: { comments: { where: { deletedAt: null } } } },
} as const;

type TaskWithRelations = {
    projectId: number | null;
    assignments: Array<{ userId: string; user: { id: string; fname: string | null; lname: string | null; primaryEmail: string | null; imageUrl: string | null } }>;
    taskTags: Array<{ tag: { id: number; name: string; color: string } }>;
    projectTaskTags: Array<{ tag: { id: number; name: string; color: string } }>;
    _count: { comments: number };
};

export type TaskCapabilities = { canEdit: boolean; canDelete: boolean; canReorder: boolean; canAssignOthers: boolean; canJoin: boolean; canLeave: boolean };

const editableCapabilities = { canEdit: true, canDelete: true, canReorder: true, canAssignOthers: true, canJoin: false, canLeave: false };

export function getProjectTaskCapabilities(role: ProjectRole, project: ProjectTaskPolicy, task: { createdById: string; assignments: Array<{ userId: string }> }, userId: string): TaskCapabilities {
    const canEdit = canEditProjectTask(role, project, task, userId);
    const active = !project.archivedAt && role !== 'viewer';
    const assigned = task.assignments.some((assignment) => assignment.userId === userId);
    return {
        canEdit,
        canDelete: canEdit,
        canReorder: canEdit,
        canAssignOthers: active && (role === 'owner' || project.editorsCanAssignOthers),
        canJoin: active && !assigned && (role === 'owner' || project.editorsCanJoinTasks),
        canLeave: active && assigned && (role === 'owner' || project.editorsCanLeaveTasks),
    };
}

export function serializeTask<T extends TaskWithRelations>(task: T, capabilities: TaskCapabilities | boolean = editableCapabilities) {
    const { taskTags, projectTaskTags, assignments, _count, ...taskFields } = task;
    const source = task.projectId ? projectTaskTags : taskTags;
    const resolved = typeof capabilities === 'boolean'
        ? { canEdit: capabilities, canDelete: capabilities, canReorder: capabilities, canAssignOthers: capabilities, canJoin: false, canLeave: false }
        : capabilities;
    return { ...taskFields, assignees: assignments.map(({ user }) => user), tags: source.map(({ tag }) => tag), commentCount: _count.comments, capabilities: resolved };
}
