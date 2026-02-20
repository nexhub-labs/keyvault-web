import { Box, Heading, Text, Avatar, VStack, HStack, SimpleGrid } from '@chakra-ui/react';
import { User } from '@supabase/supabase-js';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import { LuShieldCheck, LuDatabase } from 'react-icons/lu';
import { useColorModeValue } from '../../components/ui/color-mode';

interface ProfileCardProps {
    user: User;
    vaultStats: {
        totalItems: number;
        vaultHealth: number;
        securityScore: number;
    } | null;
}

const ProfileCard = ({ user, vaultStats }: ProfileCardProps) => {

    const getScoreColor = (score: number) => {
        if (score >= 80) return "green.400";
        if (score >= 50) return "orange.400";
        return "red.400";
    };

    return (
        <Box h="full">
            <SpotlightCard
                h="full"
                rounded="3xl"
                border="1px solid"
                borderColor={useColorModeValue("gray.200", "border.subtle")}
                bg={useColorModeValue("white", "bg.surface")}
                backdropFilter="blur(xl)"
                shadow={useColorModeValue("lg", "xl")}
                spotlightColor={useColorModeValue("rgba(64, 121, 255, 0.05)", "rgba(64, 121, 255, 0.08)")}
                p={0}
                overflow="hidden"
            >
                {/* Header Decoration */}
                <Box h="120px" bgGradient="to-b" gradientFrom="brand.500/10" gradientTo="transparent" position="absolute" top={0} w="full" zIndex={0} />

                <VStack spaceY={8} align="stretch" h="full" p={{ base: 6, md: 8 }} position="relative" zIndex={1}>

                    {/* Identity Core */}
                    <VStack spaceY={4} align="center">
                        <Box position="relative">
                            <Avatar.Root size={{ base: "xl", md: "2xl" }} variant="solid" border="4px solid" borderColor="bg.surface" shadow="lg">
                                <Avatar.Image src={user.user_metadata?.avatar_url} />
                                <Avatar.Fallback bg="brand.500" color="white" fontSize={{ base: "xl", md: "2xl" }}>
                                    {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                                </Avatar.Fallback>
                            </Avatar.Root>
                            <Box
                                position="absolute"
                                bottom="2"
                                right="2"
                                boxSize="4"
                                bg="green.400"
                                rounded="full"
                                border="3px solid"
                                borderColor="bg.surface"
                            />
                        </Box>

                        <VStack spaceY={0} align="center">
                            <Heading size={{ base: "lg", md: "xl" }} fontWeight="black" letterSpacing="tight" color="fg.primary">
                                {user.user_metadata?.full_name || 'Keyvault User'}
                            </Heading>
                            <Text color="fg.muted" fontSize="sm" fontWeight="medium">{user.email}</Text>
                        </VStack>
                    </VStack>

                    {/* Stats Grid */}
                    <Box px={2}>
                        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                            <Box p={4} rounded="2xl" bg="bg.subtle" border="1px solid" borderColor="border.subtle">
                                <VStack align="start" spaceY={1}>
                                    <HStack color="brand.400">
                                        <LuDatabase />
                                        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="fg.muted">Items</Text>
                                    </HStack>
                                    <Heading size="2xl" fontWeight="black" color="fg.primary">
                                        {vaultStats?.totalItems || 0}
                                    </Heading>
                                </VStack>
                            </Box>

                            <Box p={4} rounded="2xl" bg="bg.subtle" border="1px solid" borderColor="border.subtle">
                                <VStack align="start" spaceY={1}>
                                    <HStack color={getScoreColor(vaultStats?.securityScore || 0)}>
                                        <LuShieldCheck />
                                        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="fg.muted">Security</Text>
                                    </HStack>
                                    <HStack align="baseline" gap={1}>
                                        <Heading size="2xl" fontWeight="black" color="fg.primary">
                                            {vaultStats?.securityScore || 0}
                                        </Heading>
                                        <Text fontSize="sm" color="fg.muted" fontWeight="bold">%</Text>
                                    </HStack>
                                </VStack>
                            </Box>
                        </SimpleGrid>
                    </Box>

                    {/* Actions Removed - Moved to Sidebar */}
                    <Box mt="auto" />

                </VStack>
            </SpotlightCard>
        </Box>
    );
};

export default ProfileCard;
