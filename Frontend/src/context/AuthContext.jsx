import { createContext, useContext, useEffect, useState } from 'react'
import { getUserName } from '../utils/tokenStorage'

const AuthContext = createContext({
  userName: '',
  setUserName: () => {},
})

export function AuthProvider({ children }) {
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const storedName = getUserName()
    if (storedName) setUserName(storedName)
  }, [])

  return (
    <AuthContext.Provider value={{ userName, setUserName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

