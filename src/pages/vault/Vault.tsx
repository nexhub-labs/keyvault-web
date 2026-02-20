import { Container, VStack, Text, Box, Flex } from '@chakra-ui/react';
import { useVault } from '../../hooks/useVault';
import FavoritesList from '../dashboard/FavoritesList';
import BlurText from '../../components/BlurText/BlurText';
import GradientText from '../../components/GradientText/GradientText';
import { LuKeyRound, LuShieldCheck, LuLock } from 'react-icons/lu';
import { Link } from 'react-router';
import { AppButton } from '../../components/ui/AppButton';

const Vault = () => {
    const { vaultItems, loading, decryptPassword, deleteItem, refresh, isUnlocked } = useVault();

    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">

            {/* Ambient Background Glows */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={1} zIndex={0} />
            <Box position="absolute" top="10%" right="-5%" w="600px" h="600px" bg="brand.500" filter="blur(180px)" opacity={0.15} borderRadius="full" zIndex={0} />
            <Box position="absolute" bottom="10%" left="-5%" w="600px" h="600px" bg="brand.400" filter="blur(180px)" opacity={0.15} borderRadius="full" zIndex={0} />

            <Container maxW="container.xl" py={{ base: 6, md: 12 }} position="relative" zIndex={1}>
                <VStack align="stretch" spaceY={8}>
                    {/* Header Section */}
                    <VStack align="stretch" spaceY={8}>
                        <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                            <Flex align="center" gap={{ base: 3, md: 5 }}>
                                <Box p={{ base: 2.5, md: 3.5 }} bg="bg.subtle" rounded="2xl" color="brand.500" border="1px solid" borderColor="border.subtle" shadow="sm" display="flex" alignItems="center" justifyContent="center">
                                    <LuShieldCheck size={24} />
                                </Box>
                                <VStack align="start" spaceY={0.5}>
                                    <Text fontSize="9px" fontWeight="black" color="fg.muted" letterSpacing="widest" textTransform="uppercase">
                                        Zero-Knowledge Storage
                                    </Text>
                                    <GradientText
                                        colors={["#4ade80", "#22c55e", "#4ade80"]}
                                        animationSpeed={8}
                                        showBorder={false}
                                        className="text-3xl md:text-5xl font-black tracking-tight"
                                    >
                                        Private Vault
                                    </GradientText>
                                </VStack>
                            </Flex>

                            {!isUnlocked && (
                                <Link to="/unlock-vault">
                                    <AppButton variant="primary" size={{ base: "md", md: "lg" }} w={{ base: "full", sm: "auto" }}>
                                        <LuLock /> UNLOCK VAULT
                                    </AppButton>
                                </Link>
                            )}
                        </Flex>

                        <BlurText
                            text="Manage all your sensitive credentials in one place. Your data is protected by zero-knowledge encryption and never leaves your device unencrypted."
                            delay={30}
                            className="text-fg-muted max-w-2xl text-md md:text-lg font-medium leading-relaxed"
                        />
                    </VStack>

                    {/* Main Content Area */}
                    <Box
                        p={{ base: 4, md: 8 }}
                        bg="bg.surface"
                        rounded="2xl"
                        borderWidth="1px"
                        borderColor="border.subtle"
                        backdropFilter="blur(24px)"
                        minH="60vh"
                        shadow="sm"
                    >
                        <FavoritesList
                            vaultItems={vaultItems}
                            loading={loading}
                            decryptPassword={decryptPassword}
                            deleteItem={deleteItem}
                            refresh={refresh}
                            isUnlocked={isUnlocked}
                        />
                    </Box>

                    {/* Footer Info */}
                    <Flex justify="center" align="center" gap={3} color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="widest" fontWeight="black" opacity={0.6}>
                        <LuKeyRound size={14} />
                        <Text>Secured with AES-256-GCM Protocol</Text>
                    </Flex>
                </VStack>
            </Container>

        </Box>
    );
};

export default Vault;
