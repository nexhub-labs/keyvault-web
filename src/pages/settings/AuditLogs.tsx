import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    Table,
    Badge,
    Spinner,
    Flex,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { getAuditLogsAPI, AuditLog } from "../../api/audit";
import { LuShieldCheck, LuTriangle, LuInfo, LuLock } from "react-icons/lu";
import { toaster } from "../../components/ui/toaster";

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await getAuditLogsAPI();
                setLogs(response.logs);
            } catch (error) {
                const err = error as { response?: { status?: number } };
                console.error("Failed to fetch audit logs:", err);
                if (err.response?.status === 403) {
                    toaster.create({
                        title: "Access Denied",
                        description: "You do not have permission to view audit logs.",
                        type: "error",
                    });
                } else {
                    toaster.create({
                        title: "Error",
                        description: "Failed to load audit logs.",
                        type: "error",
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case "CRITICAL":
                return <Badge colorPalette="red" variant="solid"><LuTriangle /> CRITICAL</Badge>;
            case "WARN":
                return <Badge colorPalette="orange" variant="subtle"><LuTriangle /> WARN</Badge>;
            default:
                return <Badge colorPalette="blue" variant="subtle"><LuInfo /> INFO</Badge>;
        }
    };

    if (loading) {
        return (
            <Flex h="60vh" align="center" justify="center">
                <Spinner size="xl" color="brand.500" />
            </Flex>
        );
    }

    return (
        <VStack align="stretch" spaceY={6} p={8}>
            <VStack align="start" spaceY={2}>
                <HStack>
                    <LuShieldCheck size={28} color="var(--chakra-colors-brand-500)" />
                    <Heading size="2xl">Security Audit Logs</Heading>
                </HStack>
                <Text color="fg.muted">
                    Cryptographically signed logs of all secure operations performed within your team.
                </Text>
            </VStack>

            <Box
                bg="bg.surface"
                rounded="2xl"
                border="1px solid"
                borderColor="border.subtle"
                overflow="hidden"
                shadow="sm"
            >
                <Table.Root size="sm" variant="outline">
                    <Table.Header bg="bg.muted">
                        <Table.Row>
                            <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
                            <Table.ColumnHeader>Action</Table.ColumnHeader>
                            <Table.ColumnHeader>Resource</Table.ColumnHeader>
                            <Table.ColumnHeader>Severity</Table.ColumnHeader>
                            <Table.ColumnHeader>Verified</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <Table.Row key={log._id} _hover={{ bg: "bg.subtle" }}>
                                    <Table.Cell whiteSpace="nowrap">
                                        <Text fontSize="xs">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell fontWeight="bold">{log.action}</Table.Cell>
                                    <Table.Cell>
                                        <Badge variant="outline" size="xs">{log.resourceType}</Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {getSeverityBadge(log.severity)}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {log.signature ? (
                                            <Badge colorPalette="green" variant="surface">
                                                <LuShieldCheck /> SIGNED
                                            </Badge>
                                        ) : (
                                            <Badge colorPalette="gray" variant="surface">NO SIGNATURE</Badge>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            <Table.Row>
                                <Table.Cell colSpan={5} textAlign="center" py={10}>
                                    <VStack spaceY={2}>
                                        <LuLock size={40} opacity={0.2} />
                                        <Text color="fg.muted">No audit logs found.</Text>
                                    </VStack>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table.Root>
            </Box>
        </VStack>
    );
};

export default AuditLogs;
