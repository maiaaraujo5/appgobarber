import React, {createContext, useCallback, useContext, useState, useEffect} from "react";
import api from '../services/api'
import AsyncStorage from '@react-native-community/async-storage'

interface AuthState {
    token: string;
    user: object;
}

interface SignCredentials {
    email: string
    password: string
}

interface AuthContextData {
    user: object
    loading: boolean
    signIn(credentials: SignCredentials): Promise<void>

    signOut(): void
}

export const Auth = createContext<AuthContextData>({} as AuthContextData);
export const AuthProvider: React.FC = ({children}) => {

    const [data, setData] = useState<AuthState>({} as AuthState)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStoragedData(): Promise<void> {
            const [token, user] = await AsyncStorage.multiGet([
                '@GoBarber:token',
                '@GoBarber:user'
            ])

            if (token[1] && user[1]) {
                setData({token: token[1], user: JSON.parse(user[1])})
            }

              setLoading(false)
        }

        loadStoragedData()
    }, [])

    const signIn = useCallback(async ({email, password}) => {
        const response = await api.post('sessions', {
            email,
            password
        });

        const {token, user} =  response.data
        console.log("token:"+token)
        console.log("user:"+JSON.stringify(user))
        await AsyncStorage.multiSet([
            ['@GoBarber:token', token],
            ['@GoBarber:user', JSON.stringify(user)]
        ])

        setData({token, user: user})
    }, [])

    const signOut = useCallback(async () => {
        await AsyncStorage.multiRemove([
            '@GoBarber:token',
            '@GoBarber:user'
        ]);

        setData({} as AuthState)
    }, [])


    return (
        <Auth.Provider value={{user: data.user, loading, signIn, signOut}}>
            {children}
        </Auth.Provider>
    )
}

export function useAuth(): AuthContextData {
    const context = useContext(Auth)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}
