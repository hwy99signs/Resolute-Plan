// Wrapper for react-native-web that includes TurboModuleRegistry stub for web builds
import * as RNWeb from 'react-native-web';

// Provide TurboModuleRegistry stub for expo-modules-core compatibility
export const TurboModuleRegistry = {
  get: (name: string) => null,
  getEnforcing: (name: string) => {
    console.warn(`TurboModuleRegistry.getEnforcing called with ${name} - not available on web`);
    return {};
  },
};

// Re-export everything from react-native-web
export * from 'react-native-web';
