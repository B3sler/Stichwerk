import { useSettingsStore } from "../settingsStore";

describe("useSettingsStore", () => {
  it("has sensible defaults", () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.cardDesign).toBe("bavarian-classic");
    expect(state.soundEnabled).toBe(true);
  });

  it("updates theme, card design and sound settings", () => {
    useSettingsStore.getState().setTheme("light");
    useSettingsStore.getState().setCardDesign("bavarian-classic");
    useSettingsStore.getState().setSoundEnabled(false);

    const state = useSettingsStore.getState();
    expect(state.theme).toBe("light");
    expect(state.cardDesign).toBe("bavarian-classic");
    expect(state.soundEnabled).toBe(false);
  });
});
