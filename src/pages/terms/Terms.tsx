import { Container, VStack, Heading, Text, Box, Badge, SimpleGrid } from "@chakra-ui/react";
import SpotlightCard from "../../components/SpotlightCard/SpotlightCard";
import GradientText from "../../components/GradientText/GradientText";

const Terms = () => {
    const sections = [
        {
            number: "1",
            title: "Acceptance of Terms",
            content: `Agreement:
• By creating an account, you accept these terms.
• Your use signifies agreement to our policy.
• These terms apply to all Nexhub Labs services.
• If you disagree, please discontinue usage.
• We reserve the right to modify these terms.`
        },
        {
            number: "2",
            title: "Account Security",
            content: `Responsibility:
• You are solely responsible for your master key.
• KeyVault cannot recover lost master passwords.
• Loss of key results in permanent data loss.
• We recommend setting up recovery contacts.
• Please enable secondary authentication factors.`
        },
        {
            number: "3",
            title: "Acceptable Use",
            content: `Usage Guidelines:
• Store and manage your own data securely.
• Generate cryptographically unique keys.
• Do not store illegal or harmful content.
• No reverse engineering of security protocols.
• Do not disrupt our global infrastructure.`
        },
        {
            number: "4",
            title: "Service Availability",
            content: `Uptime & Support:
• We aim for 99.9% operational availability.
• Maintenance is announced 48 hours in advance.
• No liability for external service outages.
• Data is replicated across multiple regions.
• Automated backups occur every 24 hours.`
        },
        {
            number: "5",
            title: "Payment & Billing",
            content: `Subscription Policy:
• Free tier available for individual users.
• Premium features require active subscription.
• Billing occurs on a recurring monthly cycle.
• 14-day refund window for new members.
• Cancellation stops future billing instantly.`
        },
        {
            number: "6",
            title: "Liability Limits",
            content: `Legal Disclaimer:
• Service provided "AS IS" without warranties.
• No liability for unauthorized access attempts.
• Not responsible for user-forgotten keys.
• Liability capped at your annual spend.
• We do not guarantee fitness for all purposes.`
        },
        {
            number: "7",
            title: "Account Termination",
            content: `Closing Accounts:
• You may delete your account at any time.
• Deletion is permanent and irreversible.
• We may terminate for terms violations.
• Inactive accounts flagged after two years.
• Notification sent 90 days before cleanup.`
        },
        {
            number: "8",
            title: "Policy Changes",
            content: `Updates & Alerts:
• Terms are updated as services evolve.
• Material changes notified via dashboard.
• Continued use implies binding acceptance.
• You may export data before new terms apply.
• Archive versions available upon request.`
        }
    ];

    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">

            {/* Ambient Background Glows */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" top="10%" right="-5%" w="600px" h="600px" bg="brand.900" filter="blur(160px)" opacity={0.4} borderRadius="full" zIndex={0} />
            <Box position="absolute" bottom="10%" left="-5%" w="600px" h="600px" bg="green.900" filter="blur(160px)" opacity={0.3} borderRadius="full" zIndex={0} />

            <Container maxW="5xl" py={20} position="relative" zIndex={1}>
                <VStack align="stretch" spaceY={12}>
                    {/* Header */}
                    <VStack align="center" textAlign="center" spaceY={4}>
                        <Badge colorPalette="brand" variant="solid" rounded="full" px={4} py={1} fontSize="xs" letterSpacing="widest" textTransform="uppercase" fontWeight="black">
                            Last Updated: February 3, 2026
                        </Badge>
                        <GradientText
                            colors={["#fff", "#ccc", "#fff"]}
                            animationSpeed={8}
                            showBorder={false}
                            className="text-5xl md:text-7xl font-black tracking-tighter"
                        >
                            Terms of Service
                        </GradientText>
                        <Heading size="3xl" fontWeight="black" color="brand.400" letterSpacing="tighter">
                            Clear terms for a secure partnership
                        </Heading>
                        <Text color="fg.muted" fontSize="lg" maxW="3xl" lineHeight="1.8">
                            Welcome to KeyVault. By using our service, you agree to these terms. Please read them carefully.
                        </Text>
                    </VStack>

                    {/* Terms Sections */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                        {sections.map((section, index) => (
                            <SpotlightCard
                                key={index}
                                className="rounded-2xl border border-border-subtle bg-bg-surface backdrop-blur-xl p-8 h-full"
                                spotlightColor="rgba(34, 197, 94, 0.03)"
                            >
                                <VStack align="start" spaceY={4}>
                                    <Box
                                        w={12}
                                        h={12}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        bg="brand.400/10"
                                        rounded="xl"
                                        color="brand.400"
                                        fontSize="xl"
                                        fontWeight="black"
                                    >
                                        {section.number}
                                    </Box>
                                    <Heading size="lg" fontWeight="bold" color="fg.primary">
                                        {section.title}
                                    </Heading>
                                    <Text color="fg.muted" whiteSpace="pre-line" lineHeight="1.8">
                                        {section.content}
                                    </Text>
                                </VStack>
                            </SpotlightCard>
                        ))}
                    </SimpleGrid>

                    {/* Contact */}
                    <SpotlightCard className="rounded-2xl border border-border-subtle bg-bg-surface backdrop-blur-md p-8" spotlightColor="rgba(34, 197, 94, 0.05)">
                        <VStack align="start" spaceY={4}>
                            <Heading size="lg" fontWeight="bold" color="fg.primary">Questions About These Terms?</Heading>
                            <Text color="fg.muted" lineHeight="1.7">
                                Email <Box as="span" color="brand.400" fontWeight="bold">legal@nexhub.io</Box>
                            </Text>
                            <Text color="fg.muted" fontSize="sm" opacity={0.6}>
                                Response time: 48-72 hours
                            </Text>
                        </VStack>
                    </SpotlightCard>
                </VStack>
            </Container>
        </Box>
    );
};

export default Terms;
