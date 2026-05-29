import { createSlice } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
}

const stored = (localStorage.getItem('theme') as Theme) || 'system';

const initialState: ThemeState = { theme: stored };

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: { payload: Theme }) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      applyTheme(action.payload);
    },
    initTheme: (state) => {
      applyTheme(state.theme);
    },
  },
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
}

export const { setTheme, initTheme } = themeSlice.actions;
export default themeSlice.reducer;
