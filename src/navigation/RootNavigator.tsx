import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AssessmentScreen, RedFlagAlertScreen, AssessmentResultScreen } from '../screens/Assessment';
import { DashboardScreen } from '../screens/Dashboard';
import { RecoveryPlanScreen } from '../screens/RecoveryPlan';
import { TrackerScreen } from '../screens/Tracker';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { ProfileSetupScreen } from '../screens/Auth/ProfileSetupScreen';
import { DataEntryScreen } from '../screens/Tracker/DataEntryScreen';
import { TelemedScreen } from '../screens/Consultation/TelemedScreen';
import { useHealthEngineStore } from '../store/useHealthEngineStore';
import type { ProgramId } from '../types/health';

export type RootStackParamList = {
  Register: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined; 
  Dashboard: undefined;
  Assessment: { programId?: ProgramId } | undefined;
  RedFlagAlert: undefined;
  AssessmentResult: undefined;
  Tracker: undefined;
  RecoveryPlan: undefined;
  DataEntry: undefined;
  Telemed: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const userProfile = useHealthEngineStore(state => state.userProfile);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!userProfile ? (
        <Stack.Group>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Assessment" component={AssessmentScreen} />
          <Stack.Screen name="RedFlagAlert" component={RedFlagAlertScreen} />
          <Stack.Screen name="AssessmentResult" component={AssessmentResultScreen} />
          <Stack.Screen name="Tracker" component={TrackerScreen} />
          <Stack.Screen name="RecoveryPlan" component={RecoveryPlanScreen} />
          <Stack.Screen name="DataEntry" component={DataEntryScreen} />
          <Stack.Screen name="Telemed" component={TelemedScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};
