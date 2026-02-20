import { Navigate, Outlet } from 'react-router';
import { Center, Spinner } from '@chakra-ui/react';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = () => {
    const { isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <Center height="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;

