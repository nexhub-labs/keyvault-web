import { Box, VStack, HStack, Text, Button } from '@chakra-ui/react';
import { NavLink, useNavigate } from 'react-router';
import { LuLogOut } from 'react-icons/lu';
import { supabase } from '../utils/supabase';

import { useNavigation } from '../hooks/useNavigation';
import { useVaultContext } from '../context/VaultContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const { sidebarItems } = useNavigation();
    const { clearSession } = useVaultContext();

    const handleLogout = async () => {
        clearSession();
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <Box
            w="280px"
            position="fixed"
            left={0}
            top="var(--header-height, 81px)"
            h="calc(100vh - var(--header-height, 81px))"
            bg="bg.surface"
            borderRight="1px solid"
            borderColor="border.subtle"
            zIndex={100}
            py={8}
            px={4}
            display={{ base: 'none', lg: 'block' }}
        >
            <VStack h="full" justify="space-between" align="stretch">
                <VStack align="stretch" spaceY={8}>

                    {/* Navigation */}
                    <VStack align="stretch" spaceY={1}>
                        {sidebarItems.map((item) => (
                            <NavLink to={item.path} key={item.path} style={{ textDecoration: 'none' }}>
                                {({ isActive }) => (
                                    <HStack
                                        py={3}
                                        px={4}
                                        rounded="xl"
                                        gap={3}
                                        bg={isActive ? 'brand.500/10' : 'transparent'}
                                        color={isActive ? 'brand.500' : 'fg.muted'}
                                        _hover={{ bg: isActive ? 'brand.500/10' : 'bg.subtle', color: isActive ? 'brand.500' : 'fg.primary' }}
                                        transition="all 0.2s"
                                    >
                                        <item.icon size={20} />
                                        <Text fontWeight={isActive ? 'bold' : 'medium'} fontSize="sm">
                                            {item.label}
                                        </Text>
                                    </HStack>
                                )}
                            </NavLink>
                        ))}
                    </VStack>
                </VStack>

                {/* Footer Actions */}
                <Box borderTop="1px solid" borderColor="border.subtle" pt={4}>
                    <Button
                        variant="ghost"
                        colorPalette="red"
                        w="full"
                        justifyContent="flex-start"
                        gap={3}
                        py={6}
                        rounded="xl"
                        onClick={handleLogout}
                        _hover={{ bg: 'red.500/10', color: 'red.500' }}
                    >
                        <LuLogOut size={20} />
                        <Text fontWeight="medium">Sign Out</Text>
                    </Button>
                </Box>
            </VStack>
        </Box>
    );
};

export default Sidebar;
