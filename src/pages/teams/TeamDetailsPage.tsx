import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    Box, Container, VStack, Heading, Text, Tabs, Button, HStack,
    Table, Badge, Input, IconButton
} from '@chakra-ui/react';
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogCloseTrigger, DialogTitle } from '../../components/ui/dialog';
import { useTeams, Team } from '../../context/TeamsContext';
import EnvironmentVariables from '../environment/EnvironmentVariables';
import { LuPlus, LuTrash2, LuShield, LuUser, LuSettings } from 'react-icons/lu';
import { getPricingLimitsAPI, PricingLimitsResponse } from '../../api/auth';
import { toaster } from '../../components/ui/toaster';

const TeamDetailsPage = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const { teams, inviteMember } = useTeams();
    const [team, setTeam] = useState<Team | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [limits, setLimits] = useState<PricingLimitsResponse | null>(null);

    useEffect(() => {
        getPricingLimitsAPI().then(setLimits).catch(console.error);
    }, []);

    useEffect(() => {
        if (teamId && teams.length > 0) {
            const found = teams.find(t => t._id === teamId);
            setTeam(found || null);
        }
    }, [teamId, teams]);

    const openInviteModal = () => {
        if (limits && limits.tier === 'free') {
            toaster.create({
                title: "Sharing Feature",
                description: "Team invitation is available on Family and Teams plans.",
                type: "info",
                action: { label: "Upgrade", onClick: () => navigate('/pricing') }
            });
            return;
        }
        setIsInviteOpen(true);
    };

    const handleInvite = async () => {
        if (!inviteEmail || !teamId) return;
        try {
            await inviteMember(teamId, inviteEmail, 'member');
            setIsInviteOpen(false);
            setInviteEmail('');
        } catch (e) {
            // Context handles error toast
        } finally {
            // setIsInviting(false);
        }
    };

    if (!team) return <Box p={10}><Text>Loading team...</Text></Box>;

    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={1} zIndex={0} />

            <Container maxW="container.xl" py={12} position="relative" zIndex={1}>
                <VStack align="stretch" spaceY={8}>

                    <HStack justify="space-between">
                        <VStack align="start" spaceY={1}>
                            <Heading size="3xl" fontWeight="black" letterSpacing="tight">
                                {team.name}
                            </Heading>
                            <Text color="fg.muted">Manage members and shared secrets.</Text>
                        </VStack>
                        <Button colorPalette="brand" variant="outline" onClick={openInviteModal}>
                            <LuPlus /> Invite Member
                        </Button>
                    </HStack>

                    <Tabs.Root defaultValue="members" variant="enclosed">
                        <Tabs.List>
                            <Tabs.Trigger value="members"><LuUser /> Members</Tabs.Trigger>
                            <Tabs.Trigger value="variables"><LuShield /> Team Variables</Tabs.Trigger>
                            <Tabs.Trigger value="settings"><LuSettings /> Settings</Tabs.Trigger>
                        </Tabs.List>

                        <Tabs.Content value="members">
                            <Box border="1px solid" borderColor="border.subtle" rounded="xl" overflow="hidden">
                                <Table.Root>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader>User</Table.ColumnHeader>
                                            <Table.ColumnHeader>Role</Table.ColumnHeader>
                                            <Table.ColumnHeader>Status</Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {team.members.map((member) => (
                                            <Table.Row key={member.userId}>
                                                <Table.Cell fontWeight="medium">{member.userId.substring(0, 8)}...</Table.Cell>
                                                <Table.Cell>
                                                    <Badge colorPalette={member.role === 'OWNER' ? 'purple' : 'blue'}>
                                                        {member.role}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge colorPalette={member.status === 'active' ? 'green' : 'yellow'}>
                                                        {member.status}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell textAlign="right">
                                                    {member.role !== 'OWNER' && (
                                                        <IconButton size="xs" variant="ghost" colorPalette="red" aria-label="Remove member">
                                                            <LuTrash2 />
                                                        </IconButton>
                                                    )}
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            </Box>
                        </Tabs.Content>

                        <Tabs.Content value="variables">
                            <EnvironmentVariables teamId={teamId} />
                        </Tabs.Content>

                        <Tabs.Content value="settings">
                            <Box p={6} border="1px dashed" borderColor="border.subtle" rounded="xl">
                                <Text color="fg.muted">Team settings coming soon...</Text>
                            </Box>
                        </Tabs.Content>
                    </Tabs.Root>
                </VStack>
            </Container>

            {/* Invite Modal */}
            <DialogRoot open={isInviteOpen} onOpenChange={(e) => setIsInviteOpen(e.open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Member</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <VStack gap={4}>
                            <Text fontSize="sm" color="fg.muted">
                                Enter the email address of the user you want to invite. They must have an account.
                            </Text>
                            <Input
                                placeholder="Email Address"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                autoFocus
                            />
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                        <Button colorPalette="brand" onClick={handleInvite}>
                            Send Invitation
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>
        </Box>
    );
};

export default TeamDetailsPage;
