import { Container, VStack, Heading, Text, Box, SimpleGrid, Flex, Badge } from "@chakra-ui/react";
import SpotlightCard from "../../components/SpotlightCard/SpotlightCard";
import GradientText from "../../components/GradientText/GradientText";
import { LuShield, LuZap, LuPalette, LuGithub } from "react-icons/lu";
import BlurText from "../../components/BlurText/BlurText";

const About = () => {
    const features = [
        {
            icon: <LuShield size={32} />,
            title: "Zero-Knowledge",
            description: "Your master key never leaves your device. We use client-side AES-256-GCM encryption, ensuring total privacy even from us."
        },
        {
            icon: <LuZap size={32} />,
            title: "Peak Performance",
            description: "Built with modern optimized cryptographic libraries to deliver instant password generation and vault access without delay."
        },
        {
            icon: <LuPalette size={32} />,
            title: "Premium Design",
            description: "Every interaction is crafted with attention to detail, from fluid micro-animations to a sophisticated and dark color palette."
        },
        {
            icon: <LuGithub size={32} />,
            title: "Open Source",
            description: "Our core cryptographic modules are open source and audited by security researchers to build foundation of digital trust."
        }
    ];

    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">

            {/* Ambient Background Glows */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" top="10%" right="-5%" w="600px" h="600px" bg="brand.900" filter="blur(160px)" opacity={0.4} borderRadius="full" zIndex={0} />
            <Box position="absolute" bottom="10%" left="-5%" w="600px" h="600px" bg="green.900" filter="blur(160px)" opacity={0.3} borderRadius="full" zIndex={0} />

            <Container maxW="5xl" py={20} position="relative" zIndex={1}>
                <VStack align="stretch" spaceY={20}>
                    {/* Hero Section */}
                    <VStack align="center" textAlign="center" spaceY={6}>
                        <Badge colorPalette="brand" variant="solid" rounded="full" px={4} py={1} fontSize="xs" letterSpacing="widest" textTransform="uppercase" fontWeight="black">
                            Updated February 2026
                        </Badge>
                        <BlurText
                            text="Enterprise-grade security,"
                            delay={50}
                            className="text-4xl md:text-6xl font-black text-fg-primary"
                        />
                        <GradientText
                            colors={["#4ade80", "#22c55e", "#4ade80"]}
                            animationSpeed={8}
                            showBorder={false}
                            className="text-5xl md:text-7xl font-black tracking-tighter"
                        >
                            designed for everyone
                        </GradientText>
                        <Text color="fg.muted" maxW="3xl" fontSize="xl" fontWeight="medium" lineHeight="1.8">
                            KeyVault represents a paradigm shift in password management—combining military-grade encryption with an interface so intuitive, security becomes second nature.
                        </Text>
                    </VStack>

                    {/* Mission Statement */}
                    <SpotlightCard className="rounded-[2.5rem] border border-border-subtle bg-bg-surface backdrop-blur-xl p-12" spotlightColor="rgba(34, 197, 94, 0.05)">
                        <VStack align="stretch" spaceY={6}>
                            <Heading size="2xl" fontWeight="bold" color="fg.primary">Our Mission</Heading>
                            <Text color="fg.muted" fontSize="lg" lineHeight="1.8">
                                Founded in 2024 by Nexhub Labs, KeyVault was built on a fundamental principle: true security should never require compromise. Our team of cryptography experts, security researchers, and UX designers worked together to create a platform that protects your digital identity without sacrificing usability.
                            </Text>
                            <Text color="fg.muted" fontSize="lg" lineHeight="1.8">
                                Our mission extends beyond password management. We're building a comprehensive security ecosystem that empowers individuals and organizations to take control of their digital lives without needing a PhD in cryptography.
                            </Text>
                        </VStack>
                    </SpotlightCard>

                    {/* Features Grid */}
                    <VStack align="stretch" spaceY={8}>
                        <Heading size="3xl" fontWeight="black" color="fg.primary" textAlign="center">
                            What Makes Us Different
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            {features.map((feature, index) => (
                                <SpotlightCard
                                    key={index}
                                    className="rounded-2xl border border-border-subtle bg-bg-surface backdrop-blur-md p-8 h-full"
                                    spotlightColor="rgba(34, 197, 94, 0.03)"
                                >
                                    <VStack align="start" spaceY={4}>
                                        <Flex
                                            w={16}
                                            h={16}
                                            align="center"
                                            justify="center"
                                            bg="brand.400/10"
                                            rounded="2xl"
                                            color="brand.400"
                                        >
                                            {feature.icon}
                                        </Flex>
                                        <Heading size="lg" fontWeight="bold" color="fg.primary">
                                            {feature.title}
                                        </Heading>
                                        <Text color="fg.muted" lineHeight="1.7">
                                            {feature.description}
                                        </Text>
                                    </VStack>
                                </SpotlightCard>
                            ))}
                        </SimpleGrid>
                    </VStack>

                    {/* Team Section */}
                    <SpotlightCard className="rounded-[2.5rem] border border-border-subtle bg-bg-surface backdrop-blur-xl p-12" spotlightColor="rgba(34, 197, 94, 0.05)">
                        <VStack align="stretch" spaceY={6}>
                            <Heading size="2xl" fontWeight="bold" color="fg.primary">Built by Security Experts</Heading>
                            <Text color="fg.muted" fontSize="lg" lineHeight="1.8">
                                Our team spans 12 countries across 5 continents, united by a passion for making the internet safer. We combine decades of experience in cryptography, security research, and product design to create tools that protect millions of users worldwide.
                            </Text>
                            <Text color="fg.muted" fontSize="lg" lineHeight="1.8">
                                Every decision we make is evaluated through a security lens. We never compromise on encryption strength, never take shortcuts with user data, and never stop improving our defenses against emerging threats.
                            </Text>
                        </VStack>
                    </SpotlightCard>
                </VStack>
            </Container>
        </Box>
    );
};

export default About;
