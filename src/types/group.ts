import { NotificationPolicy } from './notification';

export const MIN_GROUP_MEMBERS = 2;
export const MAX_MEMBER_LIMIT = 50;
export const DEFAULT_MEMBER_LIMIT = 10;

export type ChatGroup = {
  id: string;
  name: string;
  photoUrl: string;
  ownerId: string;
  memberIds: string[];
  memberLimit: number;
  notificationPolicy: NotificationPolicy;
  createdAt: number;
  updatedAt: number;
};

export type CreateGroupInput = {
  name: string;
  photoUri: string | null;
  memberLimit: number;
  notificationPolicy: NotificationPolicy;
  /** Integrantes escolhidos, sem o proprietário. */
  memberIds: string[];
};

export type UpdateGroupInput = {
  name?: string;
  photoUri?: string | null;
  memberLimit?: number;
  notificationPolicy?: NotificationPolicy;
  addMemberIds?: string[];
  removeMemberIds?: string[];
};
