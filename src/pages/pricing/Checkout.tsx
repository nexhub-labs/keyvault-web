import { useSearchParams, useNavigate } from 'react-router';
import {
    Box,
    VStack,
    Text,
    Spinner,
    Heading,
    HStack,
    Container,
    Button,
    SimpleGrid,
    Badge
} from '@chakra-ui/react';
import { LuShieldCheck, LuZap, LuUsers, LuStar, LuCreditCard, LuWallet, LuArrowLeft } from 'react-icons/lu';
import { supabase } from '../../utils/supabase';
import { toaster } from '../../components/ui/toaster';
import { useState, useEffect } from 'react';
import { fetchPricingConfig, calculatePrice, PricingPlan, PricingValues } from '../../config/pricing.config';
import PricingCard from '../../components/PricingCard';
import { fetchGeoData, GeoData } from '../../utils/geo';

interface CurrencySupport {
    currency: string;
    symbol: string;
}

interface PricingConfig {
    plans?: PricingPlan[];
    values?: PricingValues;
    rates?: Record<string, number>;
    supportedCurrencies?: Record<string, CurrencySupport>;
}

const createCheckoutAPI = async (token: string, tier: string, cycle: string, countryCode: string, gateway: string) => {
    const res = await fetch(`${import.meta.env.VITE_KEYVAULT_SERVER}/pricing/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tier, cycle, countryCode, gateway })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Checkout failed');
    return data;
};

const Checkout = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const tier = searchParams.get('tier') || 'individual';
    const cycle = searchParams.get('cycle') || 'monthly';
    const [geo, setGeo] = useState<GeoData | null>(null);
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [pricingValues, setPricingValues] = useState<PricingValues | null>(null);
    const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
    const [supportedCurrencies, setSupportedCurrencies] = useState<Record<string, CurrencySupport>>({});

    const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paystack' | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        fetchGeoData().then(setGeo);
        fetchPricingConfig().then((config: PricingConfig) => {
            if (config?.plans) setPlans(config.plans);
            if (config?.values) setPricingValues(config.values);
            if (config?.rates) setRates(config.rates);
            if (config?.supportedCurrencies) setSupportedCurrencies(config.supportedCurrencies);
        });
    }, []);

    const handleCheckout = async (gateway: 'stripe' | 'paystack') => {
        setSelectedGateway(gateway);
        setIsRedirecting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                navigate('/login');
                return;
            }

            const { countryCode } = await fetchGeoData();

            const { url } = await createCheckoutAPI(session.access_token, tier, cycle, countryCode, gateway);
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('Redirect URL missing');
            }
        } catch (error: unknown) {
            const err = error as Error;
            toaster.create({
                title: 'Checkout Initialization Failed',
                description: err.message,
                type: 'error'
            });
            setIsRedirecting(false);
            setSelectedGateway(null);
        }
    };

    const plan = plans.find((p: PricingPlan) => p.tier === tier) || plans[0] || { name: 'Loading...', tier, description: 'Fetching details from server...', features: [] };

    const getPriceValue = () => {
        if (!pricingValues) return '0';
        const tierVals = pricingValues[tier];
        if (!tierVals) return '0';

        const data = cycle === 'monthly' ? tierVals.monthly : tierVals.annual;
        const baseValue = calculatePrice(data.base, data.discount);
        const countryCode = geo?.countryCode;
        const localSupport = countryCode ? supportedCurrencies[countryCode] : null;

        if (localSupport && rates[localSupport.currency]) {
            const conversionRate = rates[localSupport.currency];
            const convertedValue = baseValue * conversionRate;
            const finalValue = convertedValue > 100 ? Math.round(convertedValue) : convertedValue.toFixed(2);
            return finalValue.toLocaleString();
        }

        return baseValue.toLocaleString();
    };

    const getCurrencySymbol = () => {
        const countryCode = geo?.countryCode;
        const localSupport = countryCode ? supportedCurrencies[countryCode] : null;
        return localSupport?.symbol || '$';
    };

    const getIcon = (tier: string) => {
        switch (tier) {
            case 'free': return <LuShieldCheck size={24} />;
            case 'individual': return <LuZap size={24} />;
            case 'family': return <LuStar size={24} />;
            case 'team': return <LuUsers size={24} />;
            default: return <LuShieldCheck size={24} />;
        }
    };

    return (
        <Box minH="100vh" bg="transparent" display="flex" alignItems="center" justifyContent="center" py={12}>
            <Container maxW="3xl">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={12} alignItems="center">
                    <VStack spaceY={8} align="stretch">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')} alignSelf="start" color="fg.muted">
                            <LuArrowLeft /> Back to Plans
                        </Button>
                        <VStack spaceY={2} align="start">
                            <Heading size="3xl" fontWeight="black" letterSpacing="tighter">
                                Complete Upgrade
                            </Heading>
                            <Text color="fg.muted" fontSize="lg">
                                Secure your credentials with <Text as="span" fontWeight="bold" color="brand.400">{plan.name}</Text> protection.
                            </Text>
                        </VStack>

                        <Box transform="rotate(-2deg)">
                            <PricingCard
                                {...plan}
                                price={`${getCurrencySymbol()}${getPriceValue()}`}
                                period={cycle === 'monthly' ? '/mo' : '/yr'}
                                icon={getIcon(tier)}
                                buttonText="CHECKOUT"
                                isCurrent={false}
                                hideButton={true}
                            />
                        </Box>
                    </VStack>

                    <VStack spaceY={8} align="stretch" bg="bg.surface" p={8} rounded="3xl" border="1px solid" borderColor="border.subtle" shadow="2xl">
                        <VStack align="start" gap={1}>
                            <Text fontSize="xs" fontWeight="black" color="brand.400" letterSpacing="widest" textTransform="uppercase">
                                Step 2 / 2
                            </Text>
                            <Heading size="xl" fontWeight="black">Select Gateway</Heading>
                            <Text fontSize="sm" color="fg.muted">How would you like to pay?</Text>
                        </VStack>

                        <VStack spaceY={4} w="full">
                            <Button
                                w="full"
                                h="80px"
                                variant="outline"
                                borderColor={selectedGateway === 'paystack' ? 'brand.400' : 'border.subtle'}
                                bg={selectedGateway === 'paystack' ? 'brand.400/5' : 'transparent'}
                                onClick={() => handleCheckout('paystack')}
                                disabled={isRedirecting}
                                rounded="2xl"
                                position="relative"
                                overflow="hidden"
                                _hover={{ borderColor: 'brand.400', bg: 'bg.subtle' }}
                            >
                                <HStack w="full" px={4} justify="space-between">
                                    <HStack gap={4}>
                                        <Box p={3} bg="brand.400/10" rounded="xl" color="brand.400">
                                            <LuWallet size={24} />
                                        </Box>
                                        <VStack align="start" gap={0}>
                                            <Text fontWeight="black" fontSize="lg">Paystack</Text>
                                            <Text fontSize="xs" color="fg.muted">Local & International Cards</Text>
                                        </VStack>
                                    </HStack>
                                    <Badge colorPalette="brand" variant="solid" rounded="full">PREFERRED</Badge>
                                </HStack>
                                {isRedirecting && selectedGateway === 'paystack' && (
                                    <Box position="absolute" right={4} top="50%" transform="translateY(-50%)">
                                        <Spinner size="sm" color="brand.400" />
                                    </Box>
                                )}
                            </Button>

                            <Button
                                w="full"
                                h="80px"
                                variant="outline"
                                borderColor={selectedGateway === 'stripe' ? 'brand.400' : 'border.subtle'}
                                bg={selectedGateway === 'stripe' ? 'brand.400/5' : 'transparent'}
                                onClick={() => handleCheckout('stripe')}
                                disabled={isRedirecting}
                                rounded="2xl"
                                position="relative"
                                overflow="hidden"
                                _hover={{ borderColor: 'brand.400', bg: 'bg.subtle' }}
                            >
                                <HStack w="full" px={4} justify="space-between">
                                    <HStack gap={4}>
                                        <Box p={3} bg="blue.400/10" rounded="xl" color="blue.400">
                                            <LuCreditCard size={24} />
                                        </Box>
                                        <VStack align="start" gap={0}>
                                            <Text fontWeight="black" fontSize="lg">Stripe</Text>
                                            <Text fontSize="xs" color="fg.muted">Global Credit & Debit Cards</Text>
                                        </VStack>
                                    </HStack>
                                </HStack>
                                {isRedirecting && selectedGateway === 'stripe' && (
                                    <Box position="absolute" right={4} top="50%" transform="translateY(-50%)">
                                        <Spinner size="sm" color="brand.400" />
                                    </Box>
                                )}
                            </Button>
                        </VStack>

                        <Text fontSize="xs" color="fg.subtle" textAlign="center" pt={4}>
                            Payments are secured with 256-bit encryption. <br />
                            You will be redirected to our partner's secure portal.
                        </Text>
                    </VStack>
                </SimpleGrid>
            </Container>
        </Box>
    );
};

export default Checkout;
