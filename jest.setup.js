/* global jest */

// React Native Worklets ships a Jest-compatible runtime mock, but does not
// expose it through the package export map. Keep the wiring in one setup file
// so every Reanimated/worklet-backed screen shares the same deterministic API.
jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock.js"));
