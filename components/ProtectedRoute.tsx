import { User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { ReactNode, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

type AuthContextType = {
    currentUser: User | null;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const authContext = useContext<AuthContextType | null>(AuthContext);
    const currentUser = authContext?.currentUser;
    const router = useRouter();

    useEffect(() => {
        if (!currentUser) {
            router.push('/login');
        }
    }, [currentUser]);

    return (
        <>
            {children}
        </>
    );
};

export default ProtectedRoute;
