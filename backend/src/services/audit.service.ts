import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditAction =
    | 'TASK_CREATED'
    | 'TASK_UPDATED'
    | 'TASK_DELETED'
    | 'TEAM_CREATED'
    | 'TEAM_UPDATED'
    | 'TEAM_DELETED'
    | 'MEMBER_INVITED'
    | 'MEMBER_REMOVED'
    | 'MEMBER_ROLE_UPDATED'
    | 'MFA_ENABLED'
    | 'MFA_LOGIN';

export type ResourceType = 'TASK' | 'TEAM' | 'MEMBER' | 'USER';

interface AuditLogPayload {
    action: AuditAction;
    resourceType: ResourceType;
    resourceId?: string;
    userId: string;
    teamId?: string;
    details?: any;
}

export const logAuditAction = async (payload: AuditLogPayload) => {
    try {
        await (prisma as any).auditLog.create({
            data: {
                action: payload.action,
                resourceType: payload.resourceType,
                resourceId: payload.resourceId,
                userId: payload.userId,
                teamId: payload.teamId,
                details: payload.details ? JSON.parse(JSON.stringify(payload.details)) : null,
            }
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};
