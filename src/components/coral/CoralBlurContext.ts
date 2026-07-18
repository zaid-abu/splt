import { createContext } from "react";
import type { RefObject } from "react";
import type { View } from "react-native";

export const CoralBlurTargetContext = createContext<RefObject<View | null> | null>(null);
