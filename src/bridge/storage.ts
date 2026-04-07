import { NativeModules, TurboModuleRegistry } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

interface AsyncStorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const memoryStorage = new Map<string, string>();

let hasWarnedAboutMissingNativeStorage = false;

const warnMissingNativeStorage = () => {
  if (hasWarnedAboutMissingNativeStorage) {
    return;
  }

  hasWarnedAboutMissingNativeStorage = true;
  console.warn(
    'AsyncStorage 原生模块不可用，持久化能力会暂时降级为内存存储。',
  );
};

const hasNativeAsyncStorage = () => {
  if (NativeModules.RNAsyncStorage) {
    return true;
  }

  try {
    return Boolean(TurboModuleRegistry.get('RNAsyncStorage'));
  } catch {
    return false;
  }
};

const createMemoryStorage = (): AsyncStorageLike => ({
  getItem: async key => memoryStorage.get(key) ?? null,
  setItem: async (key, value) => {
    memoryStorage.set(key, value);
  },
  removeItem: async key => {
    memoryStorage.delete(key);
  },
});

const getAsyncStorage = (): AsyncStorageLike => {
  if (!hasNativeAsyncStorage()) {
    warnMissingNativeStorage();
    return createMemoryStorage();
  }

  try {
    const loadedModule = require('@react-native-async-storage/async-storage');
    return (loadedModule.default ?? loadedModule) as AsyncStorageLike;
  } catch {
    warnMissingNativeStorage();
    return createMemoryStorage();
  }
};

export const healthEngineStorage: StateStorage = {
  getItem: key => getAsyncStorage().getItem(key),
  setItem: (key, value) => getAsyncStorage().setItem(key, value),
  removeItem: key => getAsyncStorage().removeItem(key),
};
