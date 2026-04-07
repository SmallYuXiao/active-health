import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AssessmentScreen, RedFlagAlertScreen, AssessmentResultScreen } from '../screens/Assessment';
import { DashboardScreen } from '../screens/Dashboard';
import { RecoveryPlanScreen } from '../screens/RecoveryPlan';
import { TrackerScreen } from '../screens/Tracker';

export type RootStackParamList = {
  Dashboard: undefined;
  Assessment: undefined;
  RedFlagAlert: undefined;
  AssessmentResult: undefined;
  Tracker: undefined;
  RecoveryPlan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false, // 沉浸式体验，默认隐藏 Header
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Assessment" component={AssessmentScreen} />
      <Stack.Screen name="RedFlagAlert" component={RedFlagAlertScreen} />
      <Stack.Screen name="AssessmentResult" component={AssessmentResultScreen} />
      <Stack.Screen name="Tracker" component={TrackerScreen} />
      <Stack.Screen name="RecoveryPlan" component={RecoveryPlanScreen} />
    </Stack.Navigator>
  );
};
