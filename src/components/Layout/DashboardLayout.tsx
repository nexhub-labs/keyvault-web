import { ReactNode } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router';
import Sidebar from '../Sidebar';
import Breadcrumbs from '../Navigation/Breadcrumbs';
import QuickSwitcher from '../Navigation/QuickSwitcher';
import { TeamsProvider } from '../../context/TeamsContext';
import { FamilyProvider } from '../../context/FamilyContext';
const DashboardLayout = () => {
    // We still keep the layout structure, but providers are now always mounted
    // to prevent hook errors in child components like CreateProjectDialog.

    // Always wrap children with the appropriate providers to avoid hook errors
    const wrapWithProviders = (children: ReactNode) => {
        return (
            <FamilyProvider>
                <TeamsProvider>
                    {children}
                </TeamsProvider>
            </FamilyProvider>
        );
    };

    return wrapWithProviders(
        <Flex minH="100vh" bg="transparent">
            <Sidebar />
            <QuickSwitcher />
            <Box
                flex={1}
                ml={{ base: 0, lg: '280px' }}
                w="full"
                position="relative"
                pt={{ base: "80px", lg: 0 }}
            >
                <Box px={{ base: 4, md: 8, lg: 12 }} pt={8}>
                    <Breadcrumbs />
                </Box>
                <Outlet />
            </Box>
        </Flex>
    );
};

export default DashboardLayout;
