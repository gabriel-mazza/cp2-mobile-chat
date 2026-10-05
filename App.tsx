import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Loading } from './src/components/Loading';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import { ChatScreen } from './src/screens/ChatScreen';
import { ConversationsScreen } from './src/screens/ConversationsScreen';
import { GroupFormScreen } from './src/screens/GroupFormScreen';
import { GroupMembersScreen } from './src/screens/GroupMembersScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { UsersScreen } from './src/screens/UsersScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <Loading message="Recuperando sessão..." />;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Nova conversa' }} />
            <Stack.Screen name="GroupForm" component={GroupFormScreen} options={{ title: 'Grupo' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
            <Stack.Screen name="GroupMembers" component={GroupMembersScreen} options={{ title: 'Integrantes' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
