import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";


interface AuthContextType{
    userId: number | null
    logout: ()=> void
}

const AuthContext = createContext<AuthContextType>({
    userId: null,
    logout: () => {}
})

export function AuthProvider( { children }: { children: React.ReactNode }){
    
    const [userId, setUserId] = useState<number|null>(null)
    
    useEffect((token = localStorage.getItem("access_token") )=>{
        if (token){
            try{
                const res = jwtDecode<{ sub: number }>(token);
                setUserId(res.sub)
            } catch {
                setUserId(null)
            }
        }
    },[])

    const logout = ()=>{
        localStorage.removeItem("access_token")
    }
    
    return (
        <AuthContext.Provider value = {{userId, logout}}>
            { children }
        </AuthContext.Provider>
    )
}

export function useAuth() {
  return useContext(AuthContext);
}



