import { useState } from 'react';
import {
    Box, Container, VStack, Heading, Text, SimpleGrid,
    Input, HStack
} from '@chakra-ui/react';
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogCloseTrigger, DialogTitle } from '../../components/ui/dialog';
import { useTeams } from '../../context/TeamsContext';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import { LuUsers, LuPlus, LuArrowRight } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';
import { getPricingLimitsAPI, PricingLimitsResponse } from '../../api/auth';
import { useEffect } from 'react';
import { toaster } from '../../components/ui/toaster';
import { AppButton } from '../../components/ui/AppButton';
import { Button } from '@chakra-ui/react';

const TeamsPage = () => {
    const navigate = useNavigate();
    const { teams, createTeam, isLoading } = useTeams();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [limits, setLimits] = useState<PricingLimitsResponse | null>(null);

    useEffect(() => {
        getPricingLimitsAPI().then(setLimits).catch(console.error);
    }, []);

    const openCreateModal = () => {
        if (limits?.tier !== 'team') {
            toaster.create({
                title: "Teams Feature",
                description: "Team creation is exclusive to the Teams plan.",
                type: "info",
                action: { label: "Upgrade", onClick: () => navigate('/pricing') }
            });
            return;
        }
        setIsCreateOpen(true);
    };

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        try {
            await createTeam(newTeamName);
            setIsCreateOpen(false);
            setNewTeamName('');
        } catch (error) {
            // Error handled in context
        }
    };

    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">
            {/* Ambient Background Glows */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={1} zIndex={0} />
            <Box position="absolute" top="10%" right="-5%" w="600px" h="600px" bg="brand.500" filter="blur(180px)" opacity={0.15} borderRadius="full" zIndex={0} />

            <Container maxW="container.xl" py={{ base: 6, md: 12 }} px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
                <VStack align="stretch" spaceY={8}>

                    <HStack justify="space-between" wrap="wrap" gap={4}>
                        <VStack align="start" spaceY={2} flex={1}>
                            <Heading size={{ base: "2xl", md: "3xl" }} fontWeight="black" letterSpacing="tight">
                                My Teams
                            </Heading>
                            <Text className="text-fg-muted text-md md:text-lg">
                                Collaborate and share secrets securely.
                            </Text>
                        </VStack>
                        <AppButton variant="primary" size={{ base: "md", md: "lg" }} onClick={openCreateModal} w={{ base: "full", sm: "auto" }}>
                            <LuPlus /> Create Team
                        </AppButton>
                    </HStack>

                    {teams.length === 0 && !isLoading ? (
                        <VStack py={20} gap={6} textAlign="center" border="1px dashed" borderColor="border.subtle" rounded="2xl" bg="bg.subtle/30">
                            <Box p={6} bg="bg.surface" rounded="full" shadow="sm">
                                <LuUsers size={48} color="var(--chakra-colors-brand-400)" />
                            </Box>
                            <VStack gap={2}>
                                <Heading size="lg">No Teams Yet</Heading>
                                <Text fontSize="md" color="fg.muted" maxW="md">
                                    Create a team to start sharing secrets and managing projects collaboratively.
                                </Text>
                            </VStack>
                            <Button size="lg" variant="outline" onClick={openCreateModal}>
                                Create Your First Team
                            </Button>
                        </VStack>
                    ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                            {teams.map((team, index) => (
                                <Link to={`/teams/${team._id}`} key={index} style={{ textDecoration: 'none' }}>
                                    <SpotlightCard
                                        h="full"
                                        rounded="2xl"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        bg="bg.surface"
                                        p={6}
                                        spotlightColor="rgba(34, 197, 94, 0.1)" // brand color
                                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                        _hover={{
                                            transform: "translateY(-4px)",
                                            borderColor: "border.primary",
                                            shadow: "lg"
                                        }}
                                    >
                                        <VStack align="start" spaceY={4} h="full">
                                            <HStack justify="space-between" w="full">
                                                <Box p={2} bg="brand.500/10" color="brand.500" rounded="lg">
                                                    <LuUsers size={24} />
                                                </Box>
                                                <LuArrowRight className="text-fg-muted" />
                                            </HStack>

                                            <VStack align="start" spaceY={1}>
                                                <Heading size="lg" fontWeight="bold">
                                                    {team.name}
                                                </Heading>
                                                <Text fontSize="sm" color="fg.muted">
                                                    {team.members.length} Member{team.members.length !== 1 ? 's' : ''}
                                                </Text>
                                            </VStack>
                                        </VStack>
                                    </SpotlightCard>
                                </Link>
                            ))}
                        </SimpleGrid>
                    )}
                </VStack>
            </Container>

            {/* Create Team Modal */}
            <DialogRoot open={isCreateOpen} onOpenChange={(e) => setIsCreateOpen(e.open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Team</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <VStack gap={4}>
                            <Text fontSize="sm" color="fg.muted">
                                Give your team a name to get started. You can invite members later.
                            </Text>
                            <Input
                                placeholder="Team Name (e.g. Engineering)"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                autoFocus
                            />
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <AppButton variant="primary" onClick={handleCreateTeam}>
                            Create Team
                        </AppButton>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>
        </Box>
    );
};

export default TeamsPage;
