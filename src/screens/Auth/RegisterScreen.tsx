import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const handleMockLogin = () => {
    // Navigate straight to ProfileSetup since this is a mock auth
    navigation.replace('ProfileSetup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Active Health</Text>
        <Text style={styles.subtitle}>智能康复数字干预平台</Text>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleMockLogin}>
          <Text style={styles.buttonText}>一键开发者登录 (Mock Auth)</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: '800', color: '#E11D48', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  footer: { padding: 20 },
  button: { backgroundColor: '#111827', padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
