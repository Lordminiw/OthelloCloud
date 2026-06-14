import "@testing-library/jest-native/extend-expect";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("./src/lib/pocketbase", () => ({
  pb: {
    authStore: {
      model: { id: "user-1" },
      isValid: true,
      clear: jest.fn(),
    },
    collection: jest.fn(),
  },
}));

global.alert = jest.fn();
