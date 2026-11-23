import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {}
})

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('dark')

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('dark')
    root.classList.remove('light')
    document.body.classList.add('dark-theme')
    document.body.classList.remove('light-theme')
    localStorage.setItem('noize-theme', 'dark')
  }, [])

  const toggleTheme = () => {}
  const setTheme = () => {}

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
export default ThemeContext
