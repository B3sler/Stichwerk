import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";
export type CardDesign = "bavarian-classic";

interface SettingsState {
  theme: ThemeMode;
  cardDesign: CardDesign;
  soundEnabled: boolean;
  setTheme: (theme: ThemeMode) => void;
  setCardDesign: (cardDesign: CardDesign) => void;
  setSoundEnabled: (soundEnabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      cardDesign: "bavarian-classic",
      soundEnabled: true,
      setTheme: (theme) => set({ theme }),
      setCardDesign: (cardDesign) => set({ cardDesign }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    {
      name: "stichwerk-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
