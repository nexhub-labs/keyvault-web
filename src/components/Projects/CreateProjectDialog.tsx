import { useState } from "react";
import {
    Box,
    VStack,
    HStack,
    Text,
    Input,
    Button,
    NativeSelect,
} from "@chakra-ui/react";
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
    DialogTitle,
    DialogBackdrop,
} from "../ui/dialog";
import { LuPlus, LuUsers, LuHeart, LuCheck } from "react-icons/lu";
import { AppButton } from "../ui/AppButton";
import { useProjects } from "../../hooks/useProjects";
import { useTeams, Team } from "../../context/TeamsContext";
import { useFamily } from "../../context/FamilyContext";
import { toaster } from "../ui/toaster";
import { useEffect } from "react";
import { getPricingLimitsAPI, PricingLimitsResponse } from "../../api/auth";
import { Link } from "react-router";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (projectId: string) => void;
}

export const CreateProjectDialog = ({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) => {
    const { createProject } = useProjects();
    const { teams } = useTeams();
    const { currentFamily } = useFamily();

    const [name, setName] = useState("");
    const [type, setType] = useState<'individual' | 'team' | 'family'>('individual');
    const [teamId, setTeamId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createdProject, setCreatedProject] = useState<{ _id: string, name: string } | null>(null);
    const [limits, setLimits] = useState<PricingLimitsResponse | null>(null);

    useEffect(() => {
        if (open) {
            getPricingLimitsAPI().then(setLimits).catch(console.error);
        }
    }, [open]);

    const isFamilyAllowed = limits?.tier === 'family' || limits?.tier === 'team';
    const isTeamAllowed = limits?.tier === 'team';

    const canSubmit = name.trim() &&
        (type === 'individual' ||
            (type === 'team' && isTeamAllowed && teamId) ||
            (type === 'family' && isFamilyAllowed && currentFamily));

    const handleCreate = async () => {
        if (!name.trim()) {
            toaster.create({ title: "Project name is required", type: "error" });
            return;
        }

        if (type === 'family') {
            if (!isFamilyAllowed) {
                toaster.create({ title: "Upgrade Required", description: "Family projects require a Family or Teams plan.", type: "error" });
                return;
            }
            if (!currentFamily) {
                toaster.create({ title: "Family Circle Required", description: "Please create or join a family circle first.", type: "error" });
                return;
            }
        }

        if (type === 'team') {
            if (!isTeamAllowed) {
                toaster.create({ title: "Upgrade Required", description: "Team projects require a Teams plan.", type: "error" });
                return;
            }
            if (!teamId) {
                toaster.create({ title: "Select Team", description: "Please select a team to associate with this project.", type: "error" });
                return;
            }
        }

        setIsCreating(true);
        try {
            const project = await createProject({
                name,
                type,
                teamId: type === 'team' ? teamId : undefined,
                familyId: type === 'family' ? (currentFamily?._id) : undefined,
            });
            setCreatedProject({ _id: project._id, name: project.name });
            toaster.create({ title: "Project created", type: "success" });
            // onOpenChange(false); // Don't close immediately
            // resetForm();
            // onSuccess?.(project._id);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to create project";
            const description = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;

            toaster.create({
                title: "Creation Denied",
                description: description,
                type: "error"
            });
        } finally {
            setIsCreating(false);
        }
    };

    const resetForm = () => {
        setName("");
        setType('individual');
        setTeamId("");
        setCreatedProject(null);
    };

    const handleFinish = (addVariable: boolean) => {
        if (createdProject) {
            const id = createdProject._id;
            onOpenChange(false);
            resetForm();
            if (addVariable) {
                onSuccess?.(id);
            }
        }
    };

    return (
        <DialogRoot open={open} onOpenChange={(e) => onOpenChange(e.open)}>
            <DialogBackdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
            <DialogContent bg="bg.elevated" border="1px solid" borderColor="border.subtle" rounded="2xl" shadow="2xl">
                <DialogHeader>
                    <DialogTitle fontSize="xl" fontWeight="black" letterSpacing="tight">Launch New Project</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    {createdProject ? (
                        <VStack spaceY={6} py={8} textAlign="center">
                            <Box p={4} bg="green.500/10" rounded="full" color="green.500">
                                <LuCheck size={32} />
                            </Box>
                            <VStack spaceY={1}>
                                <Text fontSize="xl" fontWeight="black">Project Ready!</Text>
                                <Text color="fg.muted">
                                    <Text as="span" fontWeight="bold" color="brand.400">{createdProject.name}</Text> has been initialized.
                                </Text>
                            </VStack>
                        </VStack>
                    ) : (
                        <VStack spaceY={5}>
                            <Box w="full">
                                <Text fontSize="xs" fontWeight="black" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="widest">Project Identity</Text>
                                <Input
                                    placeholder="e.g. Apollo Mission, Personal Vault"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    size="lg"
                                    rounded="xl"
                                    bg="bg.subtle"
                                    fontWeight="bold"
                                />
                            </Box>

                            <Box w="full">
                                <Text fontSize="xs" fontWeight="black" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="widest">Collaboration Tier</Text>
                                <NativeSelect.Root size="lg">
                                    <NativeSelect.Field
                                        value={type}
                                        onChange={(e) => setType(e.target.value as 'individual' | 'team' | 'family')}
                                        bg="bg.subtle"
                                        rounded="xl"
                                        fontWeight="bold"
                                    >
                                        <option value="individual">Personal Project</option>
                                        <option value="team">Team Collaboration</option>
                                        <option value="family">Family Circle</option>
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                            </Box>

                            {type === 'team' && (
                                <Box w="full">
                                    <HStack mb={2} color={!isTeamAllowed ? "red.500" : "fg.muted"}>
                                        <LuUsers size={14} />
                                        <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest">Select Team</Text>
                                    </HStack>
                                    {!isTeamAllowed ? (
                                        <Box p={4} bg="red.500/5" rounded="xl" border="1px dashed" borderColor="red.500/20">
                                            <Text fontSize="xs" color="red.500">
                                                Team projects require a <strong>Teams Plan</strong>. <Link to="/pricing" style={{ textDecoration: 'underline' }}>Upgrade now</Link>
                                            </Text>
                                        </Box>
                                    ) : (
                                        <NativeSelect.Root size="lg">
                                            <NativeSelect.Field
                                                value={teamId}
                                                onChange={(e) => setTeamId(e.target.value)}
                                                bg="bg.subtle"
                                                rounded="xl"
                                                fontWeight="bold"
                                            >
                                                <option value="">Choose a team...</option>
                                                {teams.map((t: Team) => (
                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    )}
                                </Box>
                            )}

                            {type === 'family' && (
                                <Box w="full" p={4} bg={!isFamilyAllowed || !currentFamily ? "red.500/5" : "bg.subtle"} rounded="xl" border="1px dashed" borderColor={!isFamilyAllowed || !currentFamily ? "red.500/20" : "border.subtle"}>
                                    <HStack color={!isFamilyAllowed || !currentFamily ? "red.500" : "teal.500"}>
                                        <LuHeart size={16} />
                                        <Text fontSize="sm" fontWeight="bold">Family Project Context</Text>
                                    </HStack>
                                    {!isFamilyAllowed ? (
                                        <Text fontSize="xs" color="red.500" mt={2}>
                                            This feature requires a <strong>Family Plan</strong>. <Link to="/pricing" style={{ textDecoration: 'underline' }}>Upgrade now</Link>
                                        </Text>
                                    ) : !currentFamily ? (
                                        <Text fontSize="xs" color="orange.500" mt={2}>
                                            No active family circle found. <Link to="/family" style={{ textDecoration: 'underline' }}>Create one here</Link>
                                        </Text>
                                    ) : (
                                        <Text fontSize="xs" color="fg.muted" mt={2}>
                                            This project will be shared with the entire <strong>{currentFamily.name}</strong>.
                                        </Text>
                                    )}
                                </Box>
                            )}
                        </VStack>
                    )}
                </DialogBody>
                <DialogFooter borderTop="1px solid" borderColor="border.subtle" pt={4}>
                    {createdProject ? (
                        <>
                            <Button variant="ghost" onClick={() => handleFinish(false)} fontWeight="bold">Close</Button>
                            <AppButton
                                variant="primary"
                                size="lg"
                                px={8}
                                onClick={() => handleFinish(true)}
                            >
                                <LuPlus /> ADD FIRST VARIABLE
                            </AppButton>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isCreating} fontWeight="bold">Abort</Button>
                            <AppButton
                                variant="primary"
                                size="lg"
                                px={8}
                                onClick={handleCreate}
                                loading={isCreating}
                                disabled={!canSubmit}
                            >
                                <LuPlus /> INITIALIZE PROJECT
                            </AppButton>
                        </>
                    )}
                </DialogFooter>
                <DialogCloseTrigger color="fg.muted" />
            </DialogContent>
        </DialogRoot>
    );
};
