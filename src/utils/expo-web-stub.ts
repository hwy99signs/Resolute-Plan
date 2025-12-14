// Web-compatible stub for expo-modules-core requireNativeModule
// This provides empty implementations for web builds

export const TurboModuleRegistry = {
  get: (name: string) => null,
  getEnforcing: (name: string) => {
    console.warn(`TurboModuleRegistry.getEnforcing called with ${name} - not available on web`);
    return {};
  },
};

export default {
  get: (name: string) => null,
  getEnforcing: (name: string) => {
    console.warn(`Native module ${name} not available on web`);
    return {};
  },
};
