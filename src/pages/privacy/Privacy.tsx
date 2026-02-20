import { Container, VStack, Heading, Text, Box, SimpleGrid, Badge, Flex } from "@chakra-ui/react";
import SpotlightCard from "../../components/SpotlightCard/SpotlightCard";
import GradientText from "../../components/GradientText/GradientText";
import { LuDatabase, LuShieldOff, LuLock, LuMail, LuGlobe, LuScale } from "react-icons/lu";

const Privacy = () => {
    const sections = [
        {
            icon: <LuDatabase size={24} />,
            title: "Data We Collect",
            content: `Core Identity:
• Registered email address
• Optional display name
• Account timestamps
• IP for security logs
• Temporary session tokens`
        },
        {
            icon: <LuShieldOff size={24} />,
            title: "Never Collected",
            content: `Encrypted Data:
• Your master password
• Decrypted vault data
• External web activity
• Personal messages
• Payment credentials`
        },
        {
            icon: <LuLock size={24} />,
            title: "Data Protection",
            content: `Security Layer:
• Client-side encryption
• SOC 2 certified centers
• Regular security audits
• Hardened server access
• Automated threat logic`
        },
        {
            icon: <LuMail size={24} />,
            title: "Communications",
            content: `Email Policy:
• Critical security alerts
• System recovery help
• Major feature updates
• Billing notifications
• No advertising spam`
        },
        {
            icon: <LuGlobe size={24} />,
            title: "Data Location",
            content: `Global Hosting:
• Multi-region data sync
• GDPR compliance ready
• CCPA privacy standards
• Encrypted data transfers
• Localized data options`
        },
        {
            icon: <LuScale size={24} />,
            title: "User Rights",
            content: `Digital Freedom:
• Full data accessibility
• Instant account deletion
• Encrypted export tools
• Communications control
• Privacy inquiries help`
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
                            Privacy Policy
                        </GradientText>
                        <Heading size="3xl" fontWeight="black" color="brand.400" letterSpacing="tighter">
                            Your data belongs to you. Period.
                        </Heading>
                        <Text color="fg.muted" fontSize="lg" maxW="3xl" lineHeight="1.8">
                            At KeyVault, privacy isn't a feature—it's our foundation. This policy explains exactly what data we collect, why we collect it, and how we protect it.
                        </Text>
                    </VStack>

                    {/* Privacy Sections - Switched to Grid for Consistency */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                        {sections.map((section, index) => (
                            <SpotlightCard
                                key={index}
                                className="rounded-2xl border border-border-subtle bg-bg-surface backdrop-blur-xl p-8 h-full"
                                spotlightColor="rgba(34, 197, 94, 0.05)"
                            >
                                <VStack align="start" spaceY={4}>
                                    <Flex
                                        w={12}
                                        h={12}
                                        align="center"
                                        justify="center"
                                        bg="brand.400/10"
                                        rounded="xl"
                                        color="brand.400"
                                    >
                                        {section.icon}
                                    </Flex>
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
                            <Heading size="lg" fontWeight="bold" color="fg.primary">Questions About Privacy?</Heading>
                            <Text color="fg.muted" lineHeight="1.7">
                                Privacy concerns? Email <Box as="span" color="brand.400" fontWeight="bold">privacy@nexhub.io</Box>
                            </Text>
                            <Text color="fg.muted" fontSize="sm" opacity={0.6}>
                                We respond to all privacy inquiries within 48 hours.
                            </Text>
                        </VStack>
                    </SpotlightCard>
                </VStack>
            </Container>
        </Box>
    );
};

export default Privacy;
