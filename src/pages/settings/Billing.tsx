import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Box,
    Button,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Badge,
    Card,
    Spinner
} from '@chakra-ui/react';
import { toaster } from '../../components/ui/toaster';
import { supabase } from '../../utils/supabase';
import { PricingLimitsResponse } from '../../api/auth';

// API Functions
const getLimitsAPI = async (token: string) => {
    const res = await fetch(`${import.meta.env.VITE_KEYVAULT_SERVER}/pricing/limits`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch limits');
    return res.json();
};

const createPortalAPI = async (token: string) => {
    const res = await fetch(`${import.meta.env.VITE_KEYVAULT_SERVER}/pricing/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Portal failed');
    return data;
};

export default function Billing() {
    const navigate = useNavigate();
    const [limits, setLimits] = useState<PricingLimitsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchLimits = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                const data = await getLimitsAPI(session.access_token);
                setLimits(data);
            }
        } catch (error) {
            toaster.create({ title: 'Error loading billing info', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLimits();
    }, []);

    const handlePortal = async () => {
        setProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const { url } = await createPortalAPI(session.access_token);
            if (url) window.location.href = url;
            else toaster.create({ title: 'Unable to open portal', description: 'Contact support if this persists', type: 'error' });
        } catch (error) {
            const err = error as { message?: string };
            toaster.create({ title: err.message || "Failed to open portal", type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <Box p={10} textAlign="center"><Spinner size="xl" /></Box>;

    const currentTier = limits?.tier || 'free';

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spaceY={8} align="stretch">
                <Box>
                    <Heading size="2xl" mb={2}>Billing & Subscription</Heading>
                    <Text color="fg.muted">Manage your plan, payment methods, and billing history.</Text>
                </Box>

                <Card.Root variant="elevated" size="lg">
                    <Card.Body>
                        <HStack justify="space-between" wrap="wrap" gap={4}>
                            <VStack align="start" gap={1}>
                                <Text fontSize="sm" fontWeight="bold" color="fg.muted" letterSpacing="wide">CURRENT PLAN</Text>
                                <HStack>
                                    <Heading size="xl" textTransform="capitalize">{currentTier} Plan</Heading>
                                    <Badge colorPalette={currentTier === 'free' ? 'gray' : 'green'} variant="solid" size="lg">
                                        {currentTier === 'free' ? 'BASIC' : currentTier.toUpperCase()}
                                    </Badge>
                                </HStack>
                                <Text fontSize="sm" color="fg.muted">
                                    {currentTier === 'free'
                                        ? `Limited to ${limits?.vaultLimit || 50} vault items`
                                        : 'Unlimited vault items & premium features'}
                                </Text>
                            </VStack>
                            {currentTier !== 'free' ? (
                                <Button
                                    onClick={handlePortal}
                                    disabled={processing}
                                    variant="solid"
                                    colorPalette="brand"
                                    rounded="xl"
                                    size="lg"
                                >
                                    {processing ? <Spinner size="sm" /> : 'Manage Subscription'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => navigate('/pricing')}
                                    variant="solid"
                                    colorPalette="brand"
                                    rounded="xl"
                                    size="lg"
                                >
                                    Upgrade Plan
                                </Button>
                            )}
                        </HStack>
                    </Card.Body>
                </Card.Root>

                <VStack gap={4} align="stretch" w="full">
                    {currentTier === 'free' && (
                        <Card.Root variant="subtle" size="sm" bg="bg.muted/30" border="1px dashed" borderColor="border.subtle">
                            <Card.Body>
                                <HStack justify="space-between">
                                    <VStack align="start" gap={1}>
                                        <Text fontWeight="bold">Unlock Premium Features</Text>
                                        <Text fontSize="xs" color="fg.muted">Get unlimited vault items, family sharing, and advanced security audits.</Text>
                                    </VStack>
                                    <Button size="sm" onClick={() => navigate('/pricing')} variant="ghost" colorPalette="brand">
                                        View All Plans
                                    </Button>
                                </HStack>
                            </Card.Body>
                        </Card.Root>
                    )}
                </VStack>
            </VStack>
        </Container>
    );
}

