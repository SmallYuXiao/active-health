import { NativeModules, TurboModuleRegistry } from 'react-native';
import type { NetworkQuality } from '../types/health';

type CellularGeneration = '2g' | '3g' | '4g' | '5g' | null;

interface NetInfoDetails {
  cellularGeneration?: CellularGeneration;
}

interface NetInfoSnapshot {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  details: NetInfoDetails | null;
}

interface NetInfoModule {
  fetch: () => Promise<NetInfoSnapshot>;
  addEventListener: (
    listener: (state: NetInfoSnapshot) => void,
  ) => () => void;
}

let hasWarnedAboutMissingNativeModule = false;

const warnMissingNativeModule = () => {
  if (hasWarnedAboutMissingNativeModule) {
    return;
  }

  hasWarnedAboutMissingNativeModule = true;
  console.warn(
    'NetInfo 原生模块不可用，当前会降级为在线模式，直到 App 重新构建。',
  );
};

const getNetInfoModule = (): NetInfoModule | null => {
  const nativeModuleAvailable =
    Boolean(NativeModules.RNCNetInfo) ||
    (() => {
      try {
        return Boolean(TurboModuleRegistry.get('RNCNetInfo'));
      } catch {
        return false;
      }
    })();

  if (!nativeModuleAvailable) {
    warnMissingNativeModule();
    return null;
  }

  try {
    const loadedModule = require('@react-native-community/netinfo');
    return (loadedModule.default ?? loadedModule) as NetInfoModule;
  } catch {
    warnMissingNativeModule();
    return null;
  }
};

export const mapNetInfoToQuality = (state: NetInfoSnapshot): NetworkQuality => {
  if (!state.isConnected || state.isInternetReachable === false) {
    return 'offline';
  }

  if (state.type === 'cellular') {
    const generation = state.details?.cellularGeneration;

    if (generation === '2g' || generation === '3g' || generation == null) {
      return 'weak';
    }
  }

  return 'online';
};

export const initializeNetworkQuality = async (
  setNetworkQuality: (networkQuality: NetworkQuality) => void,
) => {
  const netInfoModule = getNetInfoModule();

  if (!netInfoModule) {
    setNetworkQuality('online');
    return;
  }

  try {
    const state = await netInfoModule.fetch();
    setNetworkQuality(mapNetInfoToQuality(state));
  } catch {
    setNetworkQuality('online');
  }
};

export const subscribeToNetworkQuality = (
  setNetworkQuality: (networkQuality: NetworkQuality) => void,
) => {
  const netInfoModule = getNetInfoModule();

  if (!netInfoModule) {
    setNetworkQuality('online');
    return () => undefined;
  }

  try {
    return netInfoModule.addEventListener(state => {
      setNetworkQuality(mapNetInfoToQuality(state));
    });
  } catch {
    setNetworkQuality('online');
    return () => undefined;
  }
};
