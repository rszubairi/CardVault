import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import CardListScreen from './src/screens/CardListScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Camera: undefined;
  CardDetail: { cardData: any };
  CardList: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ title: 'Scan Business Card' }}
        />
        <Stack.Screen
          name="CardDetail"
          component={CardDetailScreen}
          options={{ title: 'Card Details' }}
        />
        <Stack.Screen
          name="CardList"
          component={CardListScreen}
          options={{ title: 'My Cards' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
