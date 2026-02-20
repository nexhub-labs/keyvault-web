import { Container, VStack, Box, Flex, Button, Text, HStack } from '@chakra-ui/react';
import EnvironmentVariables from './EnvironmentVariables';
import BlurText from '../../components/BlurText/BlurText';
import GradientText from '../../components/GradientText/GradientText';
import { LuShieldCheck, LuLock, LuPlus } from 'react-icons/lu';
import { useVault } from '../../hooks/useVault';
import { Link } from 'react-router';
import { useState } from 'react';

const EnvironmentPage = () => {
    const { isUnlocked } = useVault();
    const [isAddOpen, setIsAddOpen] = useState(false);
    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">
            {/* Ambient Background Glows */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={1} zIndex={0} />
            <Box position="absolute" top="10%" right="-5%" w="600px" h="600px" bg="brand.500" filter="blur(180px)" opacity={0.15} borderRadius="full" zIndex={0} />

            <Container maxW="container.xl" py={{ base: 6, md: 12 }} px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
                <VStack align="stretch" spaceY={8}>

                    <VStack align="stretch" spaceY={8}>
                        <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                            <Flex align="center" gap={{ base: 3, md: 5 }}>
                                <Box p={{ base: 2.5, md: 3.5 }} bg="bg.subtle" rounded="2xl" color="brand.500" border="1px solid" borderColor="border.subtle" shadow="sm" display="flex" alignItems="center" justifyContent="center">
                                    <LuShieldCheck size={24} />
                                </Box>
                                <VStack align="start" spaceY={0.5}>
                                    <Text fontSize="9px" fontWeight="black" color="fg.muted" letterSpacing="widest" textTransform="uppercase">
                                        Secure Configuration
                                    </Text>
                                    <GradientText
                                        colors={["#4ade80", "#22c55e", "#4ade80"]}
                                        animationSpeed={8}
                                        showBorder={false}
                                        className="text-3xl md:text-5xl font-black tracking-tight"
                                    >
                                        Env Variables
                                    </GradientText>
                                </VStack>
                            </Flex>

                            <HStack gap={4} w={{ base: "full", sm: "auto" }}>
                                {!isUnlocked ? (
                                    <Link to="/unlock-vault" style={{ width: "100%" }}>
                                        <Button size={{ base: "md", md: "lg" }} rounded="xl" variant="solid" colorPalette="brand" fontWeight="black" shadow="md" px={{ base: 6, md: 8 }} w={{ base: "full", sm: "auto" }}>
                                            <LuLock /> UNLOCK VAULT
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button size={{ base: "md", md: "lg" }} rounded="xl" variant="solid" colorPalette="brand" fontWeight="black" shadow="md" px={{ base: 6, md: 8 }} onClick={() => setIsAddOpen(true)} w={{ base: "full", sm: "auto" }}>
                                        <LuPlus /> ADD VARIABLE
                                    </Button>
                                )}
                            </HStack>
                        </Flex>

                        <BlurText
                            text="Securely manage encrypted environment variables for your projects. Your secrets are protected by zero-knowledge encryption."
                            delay={30}
                            className="text-fg-muted max-w-2xl text-md md:text-lg font-medium leading-relaxed"
                        />
                    </VStack>

                    <Box
                        bg="bg.surface"
                        rounded="2xl"
                        border="1px solid"
                        borderColor="border.subtle"
                        backdropFilter="blur(24px)"
                        shadow="sm"
                        p={{ base: 4, md: 8 }}
                    >
                        <EnvironmentVariables isAddOpenExternally={isAddOpen} onAddClose={() => setIsAddOpen(false)} />
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default EnvironmentPage;
