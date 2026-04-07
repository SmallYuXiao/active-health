import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  initializeNetworkQuality,
  subscribeToNetworkQuality,
} from './src/bridge/netInfo';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useHealthEngineStore } from './src/store/useHealthEngineStore';

const AppBootstrap = () => {
  const isHydrated = useHealthEngineStore(state => state.isHydrated);
  const setNetworkQuality = useHealthEngineStore(state => state.setNetworkQuality);
  const syncPendingSubmissions = useHealthEngineStore(
    state => state.syncPendingSubmissions,
  );

  useEffect(() => {
    let isMounted = true;

    initializeNetworkQuality(networkQuality => {
      if (isMounted) {
        setNetworkQuality(networkQuality);
      }
    }).catch(() => undefined);

    const unsubscribe = subscribeToNetworkQuality(networkQuality => {
      if (isMounted) {
        setNetworkQuality(networkQuality);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setNetworkQuality]);

  useEffect(() => {
    if (isHydrated) {
      syncPendingSubmissions().catch(() => undefined);
    }
  }, [isHydrated, syncPendingSubmissions]);

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingTitle}>正在加载健康引擎</Text>
        <Text style={styles.loadingSubtitle}>
          正在恢复本地任务、积分、评估记录和同步队列。
        </Text>
      </View>
    );
  }

  return <RootNavigator />;
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <AppBootstrap />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  loadingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
});
