import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    SimpleGrid,
    HStack,
    Circle,
    Separator,
    Flex,
    Image,
    Badge,
    Spinner,
    Center,
} from "@chakra-ui/react";
import {
    LuCircleCheck,
    LuTriangleAlert,
    LuCircleX,
    LuShieldCheck,
    LuDatabase,
    LuServer
} from "react-icons/lu";
import { motion } from "motion/react";
import SpotlightCard from "../../components/SpotlightCard/SpotlightCard";
import { useSystemStatus } from "../../hooks/useSystemStatus";

const MotionBox = motion.create(Box);
const MotionHStack = motion.create(HStack);
const MotionVStack = motion.create(VStack);

const StatusPage = () => {
    const { health, loading } = useSystemStatus(60000);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "ok":
            case "healthy":
                return {
                    color: "green.500",
                    label: "Operational",
                    icon: LuCircleCheck,
                    desc: "All systems are performing optimally."
                };
            case "degraded":
                return {
                    color: "orange.500",
                    label: "Degraded performance",
                    icon: LuTriangleAlert,
                    desc: "We are experiencing minor latency."
                };
            default:
                return {
                    color: "red.500",
                    label: "Service outage",
                    icon: LuCircleX,
                    desc: "The service is currently unavailable."
                };
        }
    };

    if (loading) {
        return (
            <Center bg="bg.canvas" minH="100vh">
                <Spinner size="xl" color="brand.500" borderWidth="2px" />
            </Center>
        );
    }

    const overall = getStatusConfig(health?.status || "down");

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <Box bg="bg.canvas" minH="100vh" py={32} position="relative" overflow="hidden">
            {/* Abstract background elements */}
            <Box
                position="absolute"
                top="-10%"
                right="-10%"
                w="800px"
                h="800px"
                bgGradient="radial(brand.500/5, transparent 70%)"
                filter="blur(120px)"
                zIndex={0}
                pointerEvents="none"
            />
            <Box
                position="absolute"
                bottom="-20%"
                left="-10%"
                w="600px"
                h="600px"
                bgGradient="radial(brand.500/5, transparent 70%)"
                filter="blur(100px)"
                zIndex={0}
                pointerEvents="none"
            />

            <Container maxW="3xl" position="relative" zIndex={1}>
                <MotionVStack
                    gap={16}
                    align="center"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    {/* header section */}
                    <MotionVStack gap={6} textAlign="center" variants={itemVariants}>
                        <MotionHStack
                            gap={4}
                            px={5}
                            py={2.5}
                            bg="bg.surface"
                            rounded="full"
                            border="1px solid"
                            borderColor="border.subtle"
                            shadow="sm"
                        >
                            <Box position="relative">
                                <Circle size={2} bg={overall.color} />
                                {health?.status === 'ok' && (
                                    <Box
                                        position="absolute"
                                        top="0"
                                        left="0"
                                        right="0"
                                        bottom="0"
                                        rounded="full"
                                        bg={overall.color}
                                        opacity={0.3}
                                        animation="pulse 2s infinite"
                                    />
                                )}
                            </Box>
                            <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" color="fg.muted">
                                {overall.label}
                            </Text>
                        </MotionHStack>

                        <VStack gap={4}>
                            <Heading size="6xl" fontWeight="black" letterSpacing="tighter" color="fg.primary">
                                System status
                            </Heading>
                            <Text color="fg.muted" fontSize="sm" maxW="lg" fontWeight="medium" lineHeight="relaxed">
                                Transparency is a core value at Keyvault. Monitor the real-time health of our secure infrastructure.
                            </Text>
                            <Box bg="brand.500/5" border="1px solid" borderColor="brand.500/10" p={4} rounded="2xl" maxW="lg">
                                <Text fontSize="sm" color="brand.400" fontWeight="bold">
                                    Our engineers monitor these systems 24/7. In the rare event of an issue not listed here, we're likely already working on a fix.
                                </Text>
                            </Box>
                        </VStack>
                    </MotionVStack>

                    {/* status board */}
                    <MotionBox w="full" variants={itemVariants}>
                        <SpotlightCard className="w-full" spotlightColor="rgba(34, 197, 94, 0.15)">
                            <Box p={{ base: 8, md: 12 }}>
                                <SimpleGrid columns={{ base: 1, md: 2 }} gap={12}>
                                    {/* vault storage */}
                                    <HStack align="start" gap={6}>
                                        <Box
                                            p={3.5}
                                            bg="brand.500/5"
                                            color="brand.500"
                                            rounded="2xl"
                                            border="1px solid"
                                            borderColor="brand.500/10"
                                        >
                                            <LuDatabase size={22} />
                                        </Box>
                                        <VStack align="start" gap={1.5}>
                                            <Heading size="md" fontWeight="bold" letterSpacing="tight">Vault storage</Heading>
                                            <Badge
                                                variant="subtle"
                                                colorPalette={health?.services.database.status === 'healthy' ? "green" : "red"}
                                                rounded="md"
                                                fontSize="2xs"
                                                px={2}
                                            >
                                                {getStatusConfig(health?.services.database.status || 'down').label}
                                            </Badge>
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium">Encrypted primary storage layer.</Text>
                                        </VStack>
                                    </HStack>

                                    {/* auth engine */}
                                    <HStack align="start" gap={6}>
                                        <Box
                                            p={3.5}
                                            bg="brand.500/5"
                                            color="brand.500"
                                            rounded="2xl"
                                            border="1px solid"
                                            borderColor="brand.500/10"
                                        >
                                            <LuShieldCheck size={22} />
                                        </Box>
                                        <VStack align="start" gap={1.5}>
                                            <Heading size="md" fontWeight="bold" letterSpacing="tight">Auth engine</Heading>
                                            <Badge
                                                variant="subtle"
                                                colorPalette={health?.services.supabase.status === 'healthy' ? "green" : "red"}
                                                rounded="md"
                                                fontSize="2xs"
                                                px={2}
                                            >
                                                {getStatusConfig(health?.services.supabase.status || 'down').label}
                                            </Badge>
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium">Zero-knowledge authentication flow.</Text>
                                        </VStack>
                                    </HStack>

                                    {/* global api */}
                                    <HStack align="start" gap={6}>
                                        <Box
                                            p={3.5}
                                            bg="brand.500/5"
                                            color="brand.500"
                                            rounded="2xl"
                                            border="1px solid"
                                            borderColor="brand.500/10"
                                        >
                                            <LuServer size={22} />
                                        </Box>
                                        <VStack align="start" gap={1.5}>
                                            <Heading size="md" fontWeight="bold" letterSpacing="tight">Global API</Heading>
                                            <Badge
                                                variant="subtle"
                                                colorPalette={health?.status === 'ok' ? "green" : (health?.status === 'degraded' ? "orange" : "red")}
                                                rounded="md"
                                                fontSize="2xs"
                                                px={2}
                                            >
                                                {overall.label}
                                            </Badge>
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium">Keyvault core services and nodes.</Text>
                                        </VStack>
                                    </HStack>
                                </SimpleGrid>

                                <Separator my={12} opacity={0.6} borderColor="border.subtle" />

                                <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                                    <VStack align="start" gap={1}>
                                        <Text fontSize="2xs" fontWeight="bold" color="fg.subtle" letterSpacing="widest">Last check</Text>
                                        <Text fontSize="xs" fontWeight="bold" color="fg.primary">
                                            {health ? new Date(health.timestamp).toLocaleString() : 'Never'}
                                        </Text>
                                    </VStack>
                                    <HStack gap={2.5} px={4} py={1.5} bg="bg.muted" rounded="full">
                                        <LuCircleCheck size={14} color="var(--chakra-colors-brand-500)" />
                                        <Text fontSize="2xs" fontWeight="bold" color="brand.500" letterSpacing="tight">
                                            Data is refreshed automatically every minute.
                                        </Text>
                                    </HStack>
                                </Flex>
                            </Box>
                        </SpotlightCard>
                    </MotionBox>

                    {/* Footer aesthetic */}
                    <MotionVStack gap={6} variants={itemVariants} opacity={0.6}>
                        <Image src="/kv_outline.svg" h="28px" opacity={0.4} filter="grayscale(1)" />
                        <Text fontSize="xs" color="fg.subtle" fontWeight="bold" letterSpacing="widest">
                            © 2026 Nexhub Labs. All systems secured.
                        </Text>
                    </MotionVStack>
                </MotionVStack>
            </Container>
        </Box>
    );
};

export default StatusPage;
