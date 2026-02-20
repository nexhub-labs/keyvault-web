import {
VStack,
    Text,
    Badge,
    Box,
    Flex,
    Separator,
    List,
    Spinner,
    HStack,
    Center
} from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';
import { Link } from 'react-router';
import SpotlightCard from './SpotlightCard/SpotlightCard';
import { useColorModeValue } from './ui/color-mode';
import { AppButton } from './ui/AppButton';

interface PricingCardProps {
    name: string;
    tier: string;
    price: string;
    period?: string;
    description: string;
    features: string[];
    icon: React.ReactNode;
    isPopular?: boolean;
    color?: string;
    buttonText: string;
    onAction?: () => void;
    actionHref?: string;
    isCurrent?: boolean;
    processing?: boolean;
    originalPrice?: string;
    hideButton?: boolean;
}

const PricingCard = ({
    name,
    price,
    period,
    description,
    features,
    isPopular,
    buttonText,
    onAction,
    actionHref,
    isCurrent,
    processing,
    originalPrice,
    hideButton
}: PricingCardProps) => {
    const spotlightColor = useColorModeValue("rgba(0, 0, 0, 0.03)", "rgba(255, 255, 255, 0.05)");
    const cardBgAlpha = useColorModeValue(0.9, 0.5);

    // Top Header Glow - subtle glow at the very top
    const headerGlow = isPopular
        ? "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 70%)"
        : "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 70%)";

    const borderColor = isPopular
        ? "brand.500"
        : useColorModeValue("gray.200", "border.subtle");

    const shadowColor = isPopular
        ? useColorModeValue("0 20px 40px -10px rgba(0,0,0,0.1)", "0 0 40px rgba(255,255,255,0.05)")
        : useColorModeValue("0 4px 6px -1px rgba(0, 0, 0, 0.05)", "none");

    return (
        <SpotlightCard
            w="full"
            rounded="3xl"
            borderWidth="1px"
            borderColor={borderColor}
            bg={`bg.surface/${cardBgAlpha}`}
            backdropBlur="3xl"
            px={8}
            py={6}
            h="full"
            display="flex"
            flexDirection="column"
            position="relative"
            transition="all 0.5s"
            _hover={{
                translateY: "-4px",
                bg: "bg.surface/60"
            }}
            shadow="2xl"
            boxShadow={shadowColor}
            spotlightColor={spotlightColor}
        >
            {/* Top Glow Layer */}
            <Box position="absolute" top={0} left={0} w="full" h="40%" bg={headerGlow} zIndex={0} pointerEvents="none" roundedTop="2.5rem" />

            {isPopular && (
                <Box position="absolute" top="24px" right="32px" zIndex={2}>
                    <Badge
                        variant="subtle"
                        rounded="full"
                        px={3}
                        py={1}
                        fontSize="10px"
                        fontWeight="black"
                        letterSpacing="widest"
                        bg="bg.surface"
                        color="fg.primary"
                        borderColor="border.subtle"
                        borderWidth="1px"
                    >
                        Most Popular
                    </Badge>
                </Box>
            )}

            <VStack align="start" spaceY={4} w="full" position="relative" zIndex={1}>
                {/* 1. Title, Price & Description */}
                <VStack align="start" spaceY={3} w="full">
                    <Text fontWeight="bold" color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="widest">
                        {name}
                    </Text>

                    <VStack align="start" spaceY={0}>
                        <VStack align="start" spaceY={-1}>
                            {originalPrice && (
                                <HStack align="baseline" gap={1}>
                                    <Text fontSize="sm" color="fg.muted" fontWeight="bold" textDecoration="line-through" opacity={0.8}>
                                        {originalPrice}
                                    </Text>
                                    {period && (
                                        <Text fontSize="xs" color="fg.muted" fontWeight="bold">
                                            {period}
                                        </Text>
                                    )}
                                </HStack>
                            )}
                            <HStack align="baseline" gap={1}>
                                <Text fontSize="4xl" fontWeight="black" letterSpacing="tighter" color="fg.primary">
                                    {price}
                                </Text>
                                {period && (
                                    <Text fontSize="xs" color="fg.muted" fontWeight="bold">
                                        {period}
                                    </Text>
                                )}
                            </HStack>
                        </VStack>
                        <Text color="fg.muted" fontSize="sm" fontWeight="medium" lineHeight="short" maxW="full">
                            {description}
                        </Text>
                    </VStack>
                </VStack>

                {/* 2. CTA Button */}
                {!hideButton && (
                    <Box w="full">
                        <AppButton
                            asChild={!!actionHref}
                            onClick={onAction}
                            w="full"
                            disabled={processing || isCurrent}
                            variant={isPopular ? "primary" : "outline"}
                        >
                            {actionHref ? (
                                <Link to={actionHref} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                                    {isCurrent ? "Current Plan" : buttonText}
                                </Link>
                            ) : (
                                <Flex align="center" gap={2}>
                                    {processing ? <Spinner size="sm" /> : (isCurrent ? "Current Plan" : buttonText)}
                                </Flex>
                            )}
                        </AppButton>
                    </Box>
                )}

                {/* 3. Features Divider */}
                <Box w="full" position="relative" py={0}>
                    <Separator opacity={0.1} />
                    <Center position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" bg="bg.surface" px={4}>
                        <Text fontSize="9px" fontWeight="black" color="fg.muted" letterSpacing="widest" textTransform="uppercase">
                            Features
                        </Text>
                    </Center>
                </Box>

                {/* 4. Feature List */}
                <List.Root spaceY={2.5} variant="plain" w="full">
                    {features.map((feature, index) => (
                        <List.Item key={index} display="flex" alignItems="center" fontSize="xs" color="fg.muted" fontWeight="bold">
                            <Center boxSize={4} bg="bg.surface" rounded="full" mr={3} borderWidth="1px" borderColor="border.subtle">
                                <LuCheck size="8px" color="currentColor" />
                            </Center>
                            <Text lineHeight="1">{feature}</Text>
                        </List.Item>
                    ))}
                </List.Root>
            </VStack>
        </SpotlightCard>
    );
};

export default PricingCard;
