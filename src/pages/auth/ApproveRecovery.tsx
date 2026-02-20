import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { Box, Container, VStack, Heading, Text, Spinner, Button } from '@chakra-ui/react';
import { approveRecoveryAPI } from '../../api/auth';
import { LuCircleCheckBig, LuCircle } from 'react-icons/lu';

const ApproveRecovery = () => {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const requestId = searchParams.get('requestId');
    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const approve = async () => {
            if (!token || !requestId) {
                setStatus('error');
                setMessage('Invalid recovery link.');
                return;
            }

            try {
                const response = await approveRecoveryAPI(token, requestId);
                setStatus('success');
                setMessage(response.message || 'Recovery request approved successfully.');
            } catch (error) {
                const err = error as { response?: { data?: { message?: string } } };
                setStatus('error');
                setMessage(err.response?.data?.message || 'Failed to approve recovery request.');
            }
        };

        approve();
    }, [token, requestId]);

    return (
        <>
            <Box minH="100vh" bg="transparent" py={20} display="flex" flexDirection="column" justifyContent="center">
                <Container maxW="container.sm">
                    <VStack spaceY={8} bg="bg.surface" p={10} rounded="2xl" border="1px solid" borderColor="border.subtle" textAlign="center">
                        {status === 'loading' && (
                            <>
                                <Spinner size="xl" color="brand.400" />
                                <Heading size="lg" color="fg.primary">Verifying Link...</Heading>
                                <Text color="fg.muted">Please wait while we process your approval.</Text>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <Box color="brand.400" fontSize="6xl">
                                    <LuCircleCheckBig />
                                </Box>
                                <Heading size="xl" color="fg.primary">Approval Recorded</Heading>
                                <Text color="fg.muted" fontSize="lg">{message}</Text>
                                <Text color="fg.muted" opacity={0.6}>You may now close this window or return to home.</Text>
                                <Button mt={4} onClick={() => navigate('/')} colorPalette="brand" variant="outline" rounded="xl">
                                    Go to Home
                                </Button>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <Box color="red.400" fontSize="6xl">
                                    <LuCircle />
                                </Box>
                                <Heading size="xl" color="fg.primary">Approval Failed</Heading>
                                <Text color="fg.muted" fontSize="lg">{message}</Text>
                                <Text color="fg.muted" opacity={0.6}>The link may have expired or is invalid.</Text>
                                <Button mt={4} onClick={() => navigate('/')} colorPalette="red" variant="outline" rounded="xl">
                                    Go to Home
                                </Button>
                            </>
                        )}
                    </VStack>
                </Container>
            </Box>
        </>
    );
};

export default ApproveRecovery;
