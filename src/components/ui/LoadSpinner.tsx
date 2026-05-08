import { Box, VStack, Image, Spinner } from '@chakra-ui/react';
import GradientText from '../GradientText/GradientText';

interface LoadSpinnerProps {
    message?: string;
}

/**
 * LoadSpinner - A premium full-page loader with glassmorphism and the Keyvault logo.
 * Used to hide state-check flickers and during heavy crypto operations.
 */
export const LoadSpinner = ({ message = "Securing your connection..." }: LoadSpinnerProps) => {
    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            w="100vw"
            h="100vh"
            zIndex={9999}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="bg.canvas"
            _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                w: "full",
                h: "full",
                bg: "bg.canvas",
                opacity: 0.9,
                backdropFilter: "blur(12px)",
                zIndex: -1
            }}
        >
            {/* Ambient Background Glows */}
            <Box position="absolute" top="20%" right="-10%" w="500px" h="500px" bg="brand.900" filter="blur(140px)" opacity={0.3} borderRadius="full" pointerEvents="none" />
            <Box position="absolute" bottom="20%" left="-10%" w="500px" h="500px" bg="green.900" filter="blur(140px)" opacity={0.2} borderRadius="full" pointerEvents="none" />

            <VStack spaceY={8} align="center">
                <Box
                    position="relative"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    animation="pulse 2s infinite ease-in-out"
                >
                    <Box
                        position="absolute"
                        w="120px"
                        h="120px"
                        border="2px solid"
                        borderColor="brand.400"
                        borderRadius="full"
                        opacity={0.3}
                        animation="ping 3s infinite"
                    />
                    <Box
                        p={6}
                        bg="bg.muted"
                        borderRadius="3xl"
                        border="1px solid"
                        borderColor="border.subtle"
                        shadow="2xl"
                        backdropBlur="md"
                    >
                        <Image
                            src="/kv_outline.svg"
                            alt="Keyvault"
                            boxSize={14}
                            objectFit="contain"
                        />
                    </Box>
                </Box>

                <VStack spaceY={2}>
                    <GradientText
                        colors={["#fff", "#ccc", "#fff"]}
                        animationSpeed={5}
                        showBorder={false}
                        className="text-lg font-bold tracking-tight"
                    >
                        {message}
                    </GradientText>
                    <Box opacity={0.6}>
                        <Spinner size="xs" color="brand.400" />
                    </Box>
                </VStack>
            </VStack>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.8; }
                }
                @keyframes ping {
                    75%, 100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
        </Box>
    );
};
