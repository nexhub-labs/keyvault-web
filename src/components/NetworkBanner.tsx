import { Box, Flex, Text, HStack, VStack } from '@chakra-ui/react';
import { LuCloudOff, LuWifiOff, LuLoader } from 'react-icons/lu';
import { useNetwork } from '../context/NetworkContext';

const pulse = {
    "0%": { opacity: 1, transform: "scale(1)" },
    "50%": { opacity: 0.7, transform: "scale(0.98)" },
    "100%": { opacity: 1, transform: "scale(1)" },
};

const heartbeat = {
    "0%": { transform: "scale(1)", filter: "brightness(1)" },
    "50%": { transform: "scale(1.05)", filter: "brightness(1.2)" },
    "100%": { transform: "scale(1)", filter: "brightness(1)" },
};

const NetworkBanner = () => {
    const { isServerReachable, isOnline, isChecking } = useNetwork();

    if (isServerReachable && isOnline) return null;

    const accentColor = !isOnline ? "red.500" : "orange.500";
    const Icon = !isOnline ? LuWifiOff : LuCloudOff;
    const title = !isOnline ? "Network Disconnected" : "Vault Server Unreachable";
    const description = !isOnline
        ? "Your internet connection is down. Syncing is paused."
        : "Secure connection lost. Data is saved locally and will sync when restored.";

    return (
        <Box
            w="full"
            bg={`${accentColor}/10`}
            borderBottom="1px solid"
            borderColor={`${accentColor}/20`}
            py={2}
            px={4}
            position="relative"
            overflow="hidden"
            animation={isChecking ? "pulse 2s infinite ease-in-out" : undefined}
            css={{
                "@keyframes pulse": pulse,
                "@keyframes heartbeat": heartbeat
            }}
            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        >
            {/* Ambient Animated Glow */}
            <Box
                position="absolute"
                top="-50%"
                left="-10%"
                w="120%"
                h="200%"
                bgGradient={`radial(${accentColor}/5, transparent 70%)`}
                zIndex={0}
                opacity={isChecking ? 1 : 0.5}
                pointerEvents="none"
            />

            <Flex
                maxW="container.xl"
                mx="auto"
                align="center"
                justify="space-between"
                position="relative"
                zIndex={1}
                gap={6}
            >
                <HStack gap={4}>
                    <Box
                        p={2}
                        bg={`${accentColor}/15`}
                        rounded="lg"
                        color={accentColor}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        shadow={`0 0 20px -5px ${accentColor}`}
                        animation={isChecking ? "heartbeat 1.5s infinite ease-in-out" : undefined}
                    >
                        <Icon size={18} />
                    </Box>
                    <VStack align="start" gap={0}>
                        <HStack gap={2}>
                            <Text
                                fontSize="xs"
                                fontWeight="black"
                                letterSpacing="0.1em"
                                color={accentColor}
                                textTransform="uppercase"
                            >
                                {title}
                            </Text>
                            {isChecking && (
                                <HStack gap={1} opacity={0.8}>
                                    <LuLoader size={10} className="animate-spin" color="var(--chakra-colors-fg-muted)" />
                                    <Text fontSize="2xs" fontWeight="bold" color="fg.muted">
                                        RECONNECTING...
                                    </Text>
                                </HStack>
                            )}
                        </HStack>
                        <Text fontSize="xs" fontWeight="medium" color="fg.muted" opacity={0.9} display={{ base: 'none', md: 'block' }}>
                            {description}
                        </Text>
                    </VStack>
                </HStack>

                <Flex align="center" gap={3}>
                    {!isChecking && (
                        <Text fontSize="2xs" fontWeight="bold" color="fg.muted" letterSpacing="widest" textTransform="uppercase">
                            Automatic Recovery Active
                        </Text>
                    )}
                    <Box
                        w={1.5}
                        h={1.5}
                        rounded="full"
                        bg={isChecking ? accentColor : "fg.muted"}
                        shadow={isChecking ? `0 0 8px ${accentColor}` : 'none'}
                        animation={isChecking ? "pulse 1s infinite" : undefined}
                    />
                </Flex>
            </Flex>
        </Box>
    );
};

export default NetworkBanner;
