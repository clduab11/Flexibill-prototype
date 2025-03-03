import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import BillsScreen from '../screens/BillsScreen';
import AIRecommendationsScreen from '../screens/AIRecommendationsScreen';
import LinkAccountScreen from '../screens/LinkAccountScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Define the types for our navigation parameters
export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Bills: undefined;
  AIRecommendations: undefined;
  LinkAccount: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#f5f5f5' }
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Bills" component={BillsScreen} />
        <Stack.Screen name="AIRecommendations" component={AIRecommendationsScreen} />
        <Stack.Screen name="LinkAccount" component={LinkAccountScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;