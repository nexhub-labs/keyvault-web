import { Container, VStack, Box, Badge, Text, HStack, Button, Flex, Spinner } from "@chakra-ui/react";
import GradientText from "../../components/GradientText/GradientText";
import { LuZap, LuShield, LuUsers, LuStar } from "react-icons/lu";
import BlurText from "../../components/BlurText/BlurText";
import PricingCard from "../../components/PricingCard";
import { fetchPricingConfig, calculatePrice, PricingPlan, PricingValues } from "../../config/pricing.config";
import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchGeoData, GeoData } from "../../utils/geo";
import { useAuth } from "../../hooks/useAuth";
import { getPricingLimitsAPI } from "../../api/auth";

import { useColorModeValue } from "../../components/ui/color-mode";
import { logger } from "../../utils/logger";

interface PricingConfigState {
    plans: PricingPlan[];
    values: PricingValues | null;
    rates: Record<string, number>;
    supportedCurrencies: Record<string, { currency: string; symbol: string }>;
}

const Pricing = () => {
    const { session } = useAuth();
    const user = session?.user ?? null;
    const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
    const [geo, setGeo] = useState<GeoData | null>(null);
    const [config, setConfig] = useState<PricingConfigState>({
        plans: [],
        values: null,
        rates: { USD: 1 },
        supportedCurrencies: {}
    });
    const [currentTier, setCurrentTier] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const activeBg = "brand.600";
    const activeColor = "white";
    const inactiveBg = useColorModeValue("brand.100/70", "brand.600/5"); // Light green for light, subtle dark green for dark
    const borderColor = useColorModeValue("gray.300", "border.subtle");

    // 1. Parallel loading of initial data
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        Promise.all([
            fetchGeoData(),
            fetchPricingConfig()
        ]).then(([geoData, pricingData]) => {
            if (geoData) setGeo(geoData);
            if (pricingData) {
                setConfig({
                    plans: pricingData.plans || [],
                    values: pricingData.values || null,
                    rates: pricingData.rates || { USD: 1 },
                    supportedCurrencies: pricingData.supportedCurrencies || {}
                });
            } else {
                setHasError(true);
            }
        }).catch(err => {
            logger.error('Pricing page initialization error:', err);
            setHasError(true);
        }).finally(() => {
            setIsLoading(false);
            window.scrollTo(0, 0);
        });
    }, []);

    // 2. Separate session-based fetch
    useEffect(() => {
        if (session?.user) {
            getPricingLimitsAPI()
                .then(data => setCurrentTier(data.tier))
                .catch(console.error);
        }
    }, [session]);

    // 3. Memoize currency info based on geo and config
    const currencyInfo = useMemo(() => {
        const countryCode = geo?.countryCode;
        const localSupport = countryCode ? config.supportedCurrencies[countryCode] : null;
        const symbol = localSupport?.symbol || '$';
        const rate = (localSupport && config.rates[localSupport.currency]) || 1;

        return { symbol, rate };
    }, [geo, config.supportedCurrencies, config.rates]);

    // 4. Memoize price formatter
    const formatPrice = useCallback((value: number) => {
        const { symbol, rate } = currencyInfo;
        const convertedValue = value * rate;
        const finalValue = convertedValue > 100 ? Math.round(convertedValue) : convertedValue.toFixed(2);
        return `${symbol}${Number(finalValue).toLocaleString()}`;
    }, [currencyInfo]);

    // 5. Memoize the final plan data to prevent recalculation on every render
    const displayPlans = useMemo(() => {
        if (!config.values) return [];

        return config.plans.map(plan => {
            const isFree = plan.tier === 'free';
            let price = 'Free';
            let originalPrice: string | undefined = undefined;

            if (!isFree) {
                const tierVals = config.values![plan.tier];
                if (tierVals) {
                    const data = cycle === 'monthly' ? tierVals.monthly : tierVals.annual;
                    const finalPrice = calculatePrice(data.base, data.discount);
                    price = formatPrice(finalPrice);

                    if (data.discount > 0) {
                        originalPrice = formatPrice(data.base);
                    }
                }
            }

            return {
                ...plan,
                price,
                originalPrice
            };
        });
    }, [config, cycle, formatPrice]);

    const getIcon = useCallback((tier: string) => {
        switch (tier) {
            case 'free': return <LuShield size={24} />;
            case 'individual': return <LuZap size={24} />;
            case 'family': return <LuStar size={24} />;
            case 'team': return <LuUsers size={24} />;
            default: return <LuShield size={24} />;
        }
    }, []);

    if (isLoading) {
        return (
            <Box minH="100vh" bg="transparent" display="flex" alignItems="center" justifyContent="center">
                <VStack spaceY={4}>
                    <Spinner size="xl" color="brand.500" borderWidth="3px" />
                    <Text color="fg.muted" fontWeight="medium" fontSize="sm" letterSpacing="widest" textTransform="uppercase">
                        Loading Plans...
                    </Text>
                </VStack>
            </Box>
        );
    }

    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">
            {/* Ambient Background Glows */}
            <Box position="absolute" top="-10%" left="10%" w="500px" h="500px" bg="blue.900/10" filter="blur(140px)" borderRadius="full" zIndex={0} pointerEvents="none" />
            <Box position="absolute" top="20%" right="-5%" w="600px" h="600px" bg="brand.900/15" filter="blur(160px)" borderRadius="full" zIndex={0} pointerEvents="none" />
            <Box position="absolute" bottom="10%" left="-5%" w="500px" h="500px" bg="green.900/10" filter="blur(140px)" borderRadius="full" zIndex={0} pointerEvents="none" />

            <Container maxW="container.xl" py={24} position="relative" zIndex={1}>
                <VStack spaceY={16} align="stretch">
                    {/* Header */}
                    <VStack align="center" textAlign="center" spaceY={6}>
                        <Badge colorPalette="brand" variant="solid" rounded="full" px={4} py={1} fontSize="xs" letterSpacing="widest" textTransform="uppercase" fontWeight="black">
                            Pricing Plans
                        </Badge>
                        <BlurText
                            text="Simple and Affordable"
                            delay={50}
                            className="text-4xl md:text-6xl font-black text-fg-primary"
                        />
                        <GradientText
                            colors={["#ffffff", "#cccccc", "#ffffff"]}
                            animationSpeed={8}
                            showBorder={false}
                            className="text-5xl md:text-7xl font-black tracking-tighter"
                        >
                            Pricing Plans
                        </GradientText>
                        <Text color="fg.muted" maxW="2xl" fontSize="xl" fontWeight="medium">
                            Start tracking and improving your security management.
                        </Text>

                        <HStack
                            justify="center"
                            pt={8}
                            gap={3}
                            bg="bg.canvas"
                            p="4px"
                            rounded="full"
                            display="inline-flex"
                            borderWidth="1px"
                            borderColor={borderColor}
                            h="56px"
                        >
                            <Button
                                variant="ghost"
                                bg={cycle === 'monthly' ? activeBg : inactiveBg}
                                color={cycle === 'monthly' ? activeColor : "fg.muted"}
                                onClick={() => setCycle('monthly')}
                                shadow={cycle === 'monthly' ? "sm" : "none"}
                                rounded="full"
                                h="full"
                                px={8}
                                fontSize="sm"
                                fontWeight="black"
                                _hover={{
                                    bg: cycle === 'monthly' ? activeBg : inactiveBg,
                                    opacity: 0.9
                                }}
                                transition="all 0.2s"
                            >
                                Monthly
                            </Button>
                            <Button
                                variant="ghost"
                                bg={cycle === 'annual' ? activeBg : inactiveBg}
                                color={cycle === 'annual' ? activeColor : "fg.muted"}
                                onClick={() => setCycle('annual')}
                                shadow={cycle === 'annual' ? "sm" : "none"}
                                rounded="full"
                                h="full"
                                px={8}
                                fontSize="sm"
                                fontWeight="black"
                                _hover={{
                                    bg: cycle === 'annual' ? activeBg : inactiveBg,
                                    opacity: 0.9
                                }}
                                transition="all 0.2s"
                            >
                                <HStack gap={2}>
                                    <Text>Annual</Text>
                                    <Badge
                                        bg={"green.500"}
                                        color={"white"}
                                        fontSize="10px"
                                        fontWeight="black"
                                        rounded="full"
                                        px={2}
                                        borderWidth="0"
                                    >
                                        SAVE 20%
                                    </Badge>
                                </HStack>
                            </Button>
                        </HStack>
                    </VStack>

                    {/* Pricing Grid */}
                    {hasError ? (
                        <VStack py={20} spaceY={6} textAlign="center" bg="bg.surface/40" backdropFilter="blur(20px)" rounded="3xl" border="1px solid" borderColor="border.subtle" p={10}>
                            <LuZap size={48} color="orange" />
                            <VStack spaceY={2}>
                                <Text fontSize="2xl" fontWeight="black" color="fg.primary">Pricing Currently Unavailable</Text>
                                <Text color="fg.muted" maxW="md">
                                    We're currently updating our pricing systems. Please check back in a few minutes or contact support if you need immediate assistance.
                                </Text>
                            </VStack>
                            <Button variant="outline" rounded="full" px={8} onClick={() => window.location.reload()}>
                                Retry Loading
                            </Button>
                        </VStack>
                    ) : (
                        <Flex justify="center" align="stretch" wrap="wrap" gap={8} w="full" maxW="1400px" mx="auto">
                            {displayPlans.map((plan, index) => {
                                const isFree = plan.tier === 'free';

                                return (
                                    <Box
                                        key={index}
                                        w={{ base: "full", md: "calc(50% - 16px)", lg: "380px" }}
                                        display="flex"
                                    >
                                        <PricingCard
                                            {...plan}
                                            buttonText={plan.tier.toLowerCase() === 'team' ? "Contact Sales" : (isFree ? "Start for Free" : plan.buttonText)}
                                            price={plan.price}
                                            originalPrice={plan.originalPrice}
                                            period={isFree ? undefined : (cycle === 'monthly' ? '/mo' : '/yr')}
                                            icon={getIcon(plan.tier)}
                                            isCurrent={!!(user && currentTier === plan.tier)}
                                            actionHref={plan.tier.toLowerCase() === "team" ? "mailto:sales@nexhub.labs" : (isFree ? (user ? "/dashboard" : "/signup") : (user ? `/checkout?tier=${plan.tier}&cycle=${cycle}` : `/signup?redirect=/checkout?tier=${plan.tier}&cycle=${cycle}`))}
                                        />
                                    </Box>
                                );
                            })}
                        </Flex>
                    )}

                    {/* FAQ/Trust Section */}
                    <VStack spaceY={8} py={10}>
                        <HStack spaceX={2} color="fg.muted" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" opacity={0.6}>
                            <LuStar size={14} />
                            <Text>Trusted by security enthusiasts worldwide</Text>
                            <LuStar size={14} />
                        </HStack>
                    </VStack>
                </VStack>
            </Container>
        </Box>
    );
};

export default Pricing;
