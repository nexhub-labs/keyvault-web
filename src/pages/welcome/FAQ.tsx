import { Box, Container, Flex, Heading, Image, Text, VStack } from "@chakra-ui/react";
import { AccordionItem, AccordionItemContent, AccordionItemTrigger, AccordionRoot } from "../../components/ui/accordion";
import { faqs } from "../../utils/data";
import { useState } from "react";
import { motion } from "motion/react";

const MotionBox = motion.create(Box);
const MotionHeading = motion.create(Heading);
const MotionImage = motion.create(Image);

const FAQ = () => {

    const [index, setIndex] = useState(0);

    return (
        <>
            <Box as={Container} maxW={"6xl"} px={{ base: 6, lg: 12 }} py={20} position="relative">
                {/* Background Glow */}
                <Box
                    position="absolute"
                    top="-20%"
                    left="40%"
                    w="50%"
                    h="60%"
                    bgGradient="radial(brand.500/5, transparent 70%)"
                    filter="blur(80px)"
                    zIndex={0}
                    pointerEvents="none"
                />

                <VStack gap={4} textAlign="center" mb={12} position="relative" zIndex={1}>
                    <Text
                        fontSize="sm"
                        fontWeight="black"
                        color="brand.500"
                        letterSpacing="widest"
                        textTransform="uppercase"
                    >
                        Got Questions?
                    </Text>
                    <MotionHeading
                        fontSize={{ base: "4xl", md: "5xl" }}
                        fontWeight="black"
                        letterSpacing="tight"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        color="fg.primary"
                    >
                        Frequently Asked Questions
                    </MotionHeading>
                </VStack>
                <Flex direction={{ base: "column", md: "row" }} gap={10} justifyContent={"center"} alignItems={"stretch"} position="relative" zIndex={1}>
                    <AccordionRoot collapsible size={"lg"} flex="1">
                        {faqs.map((item, index) => (
                            <AccordionItem
                                key={index}
                                value={item.title}
                                border="1px solid"
                                borderColor="border.subtle"
                                bg="bg.surface"
                                rounded="2xl"
                                mb={4}
                                shadow="sm"
                                _hover={{ borderColor: "brand.500/30", bg: "bg.muted" }}
                                transition="all 0.2s"
                            >
                                <AccordionItemTrigger onClick={() => setIndex(index)} px={6} py={5}>
                                    <Text fontWeight="black" color="fg.primary" fontSize="md">{item.title}</Text>
                                </AccordionItemTrigger>
                                <AccordionItemContent px={6} pb={6} color="fg.muted" fontWeight="medium" fontSize="sm" lineHeight="tall">
                                    {item.text}
                                </AccordionItemContent>
                            </AccordionItem>
                        ))}
                    </AccordionRoot>
                    <MotionBox
                        w={{ base: "100%", md: "45%" }}
                        initial={false}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                        rounded="3xl"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="border.subtle"
                        shadow="2xl"
                        bg="bg.surface"
                        display="flex"
                        alignItems="center"
                    >
                        <MotionImage
                            src={faqs[index].image}
                            alt={faqs[index].title}
                            w="full"
                            h="full"
                            objectFit="cover"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={index} // Force re-mount animation on index change
                            transition={{ duration: 0.5 }}
                        />
                    </MotionBox>
                </Flex>
            </Box>
        </>
    );
};

export default FAQ;