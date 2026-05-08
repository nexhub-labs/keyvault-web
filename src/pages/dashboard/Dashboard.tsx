import { Container, VStack, Heading, Text, Box, SimpleGrid, Flex, HStack } from '@chakra-ui/react';
import ProfileCard from './ProfileCard';
import { useAuth } from '../../hooks/useAuth';
import { useVault } from '../../hooks/useVault';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import { LuArrowRight } from 'react-icons/lu';
import { Link } from 'react-router';

import { useNavigation } from '../../hooks/useNavigation';

const Dashboard = () => {
    const { session } = useAuth();
    const { vaultStats } = useVault();
    const { quickActions } = useNavigation();

    if (!session?.user) return null;

    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">
            {/* Ambient Background Glows */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={1} zIndex={0} />
            <Box position="absolute" top="20%" right="-10%" w="600px" h="600px" bg="brand.500" filter="blur(160px)" opacity={0.1} borderRadius="full" zIndex={0} />

            <Container maxW="container.xl" py={12} position="relative" zIndex={1}>
                <VStack align="stretch" spaceY={12}>

                    {/* Welcome Section */}
                    <Box>
                        <ProfileCard user={session.user} vaultStats={vaultStats} />
                    </Box>

                    <VStack align="start" spaceY={6}>
                        <Heading size="2xl" fontWeight="black" letterSpacing="tight">
                            Quick Actions
                        </Heading>

                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} w="full">
                            {quickActions.map((item, index) => (
                                <Link to={item.path} key={index} style={{ textDecoration: 'none', height: '100%' }}>
                                    <SpotlightCard
                                        h="full"
                                        rounded="2xl"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        bg="bg.surface"
                                        p={6}
                                        spotlightColor={item.color}
                                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                        _hover={{
                                            transform: "translateY(-4px)",
                                            borderColor: "border.primary",
                                            shadow: "lg"
                                        }}
                                    >
                                        <VStack align="start" spaceY={4} h="full">
                                            <Box
                                                p={3}
                                                bg={item.color.replace('1)', '0.1)')}
                                                color={item.color.replace('1)', '1)')}
                                                rounded="xl"
                                            >
                                                <Box as={item.icon} fontSize="2xl" />
                                            </Box>

                                            <VStack align="start" spaceY={1}>
                                                <Heading size="md" fontWeight="bold">
                                                    {item.label}
                                                </Heading>
                                                <Text fontSize="sm" color="fg.muted" lineHeight="tall">
                                                    {item.description}
                                                </Text>
                                            </VStack>

                                            <Flex flex={1} align="flex-end" w="full">
                                                <HStack color="fg.subtle" fontWeight="medium" fontSize="sm" _groupHover={{ color: "fg.primary" }}>
                                                    <Text>Open</Text>
                                                    <LuArrowRight />
                                                </HStack>
                                            </Flex>
                                        </VStack>
                                    </SpotlightCard>
                                </Link>
                            ))}
                        </SimpleGrid>
                    </VStack>

                </VStack>
            </Container>
        </Box>
    );
};

export default Dashboard;
