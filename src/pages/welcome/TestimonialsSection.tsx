import React, { useState, useRef } from "react";
import { Box, Flex, Text, Image, HStack, Avatar, Container, IconButton, Badge, VStack } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { testimonials } from "../../utils/data";
import { useColorModeValue } from "../../components/ui/color-mode";
import { Navigation, Autoplay } from "swiper/modules";
import { motion } from "motion/react";
import { capitalize, toUpperCase } from "../../utils/changeCase";
import { LuChevronLeft, LuChevronRight, LuQuote } from "react-icons/lu";
import GradientText from "../../components/GradientText/GradientText";
import BlurText from "../../components/BlurText/BlurText";

// Chakra + Motion Integration
const MotionBox = motion.create(Box);

const TestimonialsSection: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const swiperRef = useRef<any>(null);
    const glowOpacity = useColorModeValue(0.08, 0.2);
    const cardBg = useColorModeValue("whiteAlpha.800", "whiteAlpha.100");
    const cardBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

    const handleSlideChange = (swiper: { realIndex: number }) => {
        setActiveIndex(swiper.realIndex);
    };

    const handleProgressClick = (index: number) => {
        if (swiperRef.current) {
            swiperRef.current.slideToLoop(index);
        }
    };

    return (
        <Box as="section" position="relative" py={24} overflow="hidden">
            {/* Ambient Background Glows */}
            <Box position="absolute" top="-10%" left="50%" transform="translateX(-50%)" w="800px" h="400px" bg="brand.900" filter="blur(160px)" opacity={glowOpacity} borderRadius="full" zIndex={0} />
            <Box position="absolute" bottom="-5%" left="-5%" w="500px" h="500px" bg="green.900" filter="blur(140px)" opacity={glowOpacity * 0.75} borderRadius="full" zIndex={0} />

            <Container maxW="7xl" position="relative" zIndex={1}>
                <Flex
                    direction={{ base: "column", lg: "row" }}
                    gap={16}
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    {/* Section Heading Area */}
                    <VStack w={{ base: "100%", lg: "40%" }} align="start" spaceY={8}>
                        <VStack align="start" spaceY={4}>
                            <Badge colorPalette="brand" variant="solid" rounded="full" px={4} py={1} fontSize="xs" letterSpacing="widest" textTransform="uppercase" fontWeight="black">
                                Success Stories
                            </Badge>
                            <BlurText
                                text="What our"
                                delay={50}
                                className="text-4xl md:text-6xl font-black text-fg-primary leading-none"
                            />
                            <GradientText
                                colors={["#4ade80", "#22c55e", "#4ade80"]}
                                animationSpeed={8}
                                showBorder={false}
                                className="text-5xl md:text-7xl font-black tracking-tighter leading-none"
                            >
                                users think of us
                            </GradientText>
                        </VStack>

                        <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" lineHeight="tall">
                            We value your satisfaction above all else. We take pride in providing a service that is both easy to use and secure, giving our customers peace of mind when it comes to their passwords and passkeys.
                        </Text>

                        {/* Navigation Controls */}
                        <HStack gap={4} pt={4}>
                            <IconButton
                                aria-label="Previous slide"
                                variant="outline"
                                rounded="full"
                                size="lg"
                                borderColor="border.subtle"
                                _hover={{ bg: "bg.muted", borderColor: "brand.500" }}
                                onClick={() => swiperRef.current?.slidePrev()}
                            >
                                <LuChevronLeft size={24} />
                            </IconButton>
                            <IconButton
                                aria-label="Next slide"
                                variant="outline"
                                rounded="full"
                                size="lg"
                                borderColor="border.subtle"
                                _hover={{ bg: "bg.muted", borderColor: "brand.500" }}
                                onClick={() => swiperRef.current?.slideNext()}
                            >
                                <LuChevronRight size={24} />
                            </IconButton>
                        </HStack>

                        {/* Progress Indicator */}
                        <HStack gap={2} pt={4}>
                            {testimonials.map((_, index) => (
                                <Box
                                    key={index}
                                    w={index === activeIndex ? 12 : 3}
                                    h={2}
                                    bg={index === activeIndex ? "brand.500" : "bg.emphasized"}
                                    rounded="full"
                                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                                    cursor="pointer"
                                    onClick={() => handleProgressClick(index)}
                                    _hover={{ bg: index === activeIndex ? "brand.500" : "fg.subtle" }}
                                />
                            ))}
                        </HStack>
                    </VStack>

                    {/* Testimonial Cards with Swiper */}
                    <Box w={{ base: "100%", lg: "55%" }} position="relative">
                        <Swiper
                            breakpoints={{
                                0: { slidesPerView: 1 },
                                768: { slidesPerView: 2 },
                            }}
                            spaceBetween={24}
                            loop={true}
                            autoplay={{ delay: 6000, disableOnInteraction: false }}
                            speed={800}
                            modules={[Navigation, Autoplay]}
                            onSlideChange={handleSlideChange}
                            onSwiper={(swiper) => (swiperRef.current = swiper)}
                            style={{ padding: '20px', margin: '-20px' }}
                        >
                            {testimonials.map((testimonial, index) => (
                                <SwiperSlide key={index}>
                                    <MotionBox
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        bg={cardBg}
                                        backdropFilter="blur(16px)"
                                        borderWidth="1px"
                                        borderColor={cardBorder}
                                        rounded="2xl"
                                        p={8}
                                        h="420px"
                                        display="flex"
                                        flexDirection="column"
                                        justifyContent="space-between"
                                        position="relative"
                                        _hover={{
                                            borderColor: "brand.500",
                                            bg: useColorModeValue("white", "whiteAlpha.200"),
                                            transform: "translateY(-8px)",
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        <Box position="absolute" top={6} right={8} color={useColorModeValue("blackAlpha.100", "whiteAlpha.200")}>
                                            <LuQuote size={40} />
                                        </Box>

                                        <VStack align="start" flex={1} spaceY={6} position="relative">
                                            <Image
                                                w={10}
                                                h={10}
                                                src={testimonial.office.icon}
                                                alt={testimonial.office.name}
                                                filter={useColorModeValue("none", "brightness(0) invert(1)")}
                                                opacity={0.8}
                                            />

                                            <Text fontSize="md" fontStyle="italic" color="fg.primary" lineHeight="relaxed">
                                                "{testimonial.feedback}"
                                            </Text>
                                        </VStack>

                                        <HStack pt={8} borderTopWidth="1px" borderColor={useColorModeValue("blackAlpha.100", "whiteAlpha.100")}>
                                            <Avatar.Root size="md" border="2px solid" borderColor="brand.500">
                                                <Avatar.Image src={testimonial.avatar} alt={testimonial.name} />
                                                <Avatar.Fallback children={testimonial.name?.[0]} />
                                            </Avatar.Root>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="bold" fontSize="md" color="fg.primary">
                                                    {capitalize(testimonial.name)}
                                                </Text>
                                                <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                                                    {toUpperCase(testimonial.office.position)}, {capitalize(testimonial.office.name)}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </MotionBox>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </Box>
                </Flex>
            </Container>
        </Box>
    );
};

export default TestimonialsSection;
