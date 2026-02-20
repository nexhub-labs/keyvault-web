import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router';
import Sidebar from '../Sidebar';
import Breadcrumbs from '../Navigation/Breadcrumbs';
import QuickSwitcher from '../Navigation/QuickSwitcher';

const DashboardLayout = () => {
    return (
        <Flex minH="100vh" bg="transparent">
            <Sidebar />
            <QuickSwitcher />
            <Box
                flex={1}
                ml={{ base: 0, lg: '280px' }} // Offset for sidebar
                w="full"
                position="relative"
                pt={{ base: "80px", lg: 0 }} // Header height offset for mobile
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
