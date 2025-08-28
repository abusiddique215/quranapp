import React, { PropsWithChildren, createContext, useContext } from 'react';
import { colors } from './colors';

interface Theme {
  colors: typeof colors;
}

const ThemeContext = createContext<Theme>({ colors });

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={{ colors }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
