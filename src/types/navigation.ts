import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ConversationType } from './chat';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Conversations: undefined;
  Users: undefined;
  GroupForm: { groupId?: string } | undefined;
  Chat: { conversationId: string; conversationType: ConversationType };
  Profile: { userId: string };
  GroupMembers: { groupId: string };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
