/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');

  reactNative.NativeModules.RNAsyncStorage = {};
  reactNative.NativeModules.RNCNetInfo = {};
  reactNative.TurboModuleRegistry.get = jest.fn((name: string) => {
    if (name === 'RNAsyncStorage' || name === 'RNCNetInfo') {
      return {};
    }

    return null;
  });

  return reactNative;
});

jest.mock('@react-native-async-storage/async-storage', () =>
  ({
    __esModule: true,
    default: {
      getItem: jest.fn(() => Promise.resolve(null)),
      setItem: jest.fn(() => Promise.resolve()),
      removeItem: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
  }),
);

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() =>
      Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: null,
      }),
    ),
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
