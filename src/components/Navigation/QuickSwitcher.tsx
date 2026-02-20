import { Box, Input, VStack, HStack, Text, Kbd, Flex, Badge } from '@chakra-ui/react';
import { useNavigation } from '../../hooks/useNavigation';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { LuSearch, LuCommand } from 'react-icons/lu';
import {
    DialogRoot,
    DialogContent,
    DialogBody,
    DialogHeader,
    DialogBackdrop,
    DialogCloseTrigger,
} from '../ui/dialog';

const QuickSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const { allItems } = useNavigation();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredItems = allItems.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <DialogRoot open={isOpen} onOpenChange={(details) => setIsOpen(details.open)} size="lg">
            <DialogBackdrop bg="black/40" backdropFilter="blur(8px)" />
            <DialogContent bg="bg.surface" rounded="3xl" shadow="2xl" border="1px solid" borderColor="border.subtle" mt="20vh">
                <DialogHeader borderBottom="1px solid" borderColor="border.subtle" p={4}>
                    <HStack gap={3}>
                        <LuSearch color="var(--chakra-colors-fg-muted)" />
                        <Input
                            ref={inputRef}
                            autoFocus
                            placeholder="Type to search pages..."
                            variant="plain"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            fontSize="lg"
                            fontWeight="medium"
                        />
                        <HStack gap={1} opacity={0.5}>
                            <Kbd size="sm"><LuCommand size={10} /></Kbd>
                            <Kbd size="sm">K</Kbd>
                        </HStack>
                    </HStack>
                </DialogHeader>
                <DialogBody p={2} maxH="400px" overflowY="auto">
                    <VStack align="stretch" gap={1}>
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <HStack
                                    key={item.id}
                                    p={4}
                                    rounded="2xl"
                                    cursor="pointer"
                                    _hover={{ bg: "bg.subtle" }}
                                    onClick={() => handleSelect(item.path)}
                                    transition="all 0.2s"
                                >
                                    <Box p={2.5} bg={`${item.color.replace('1)', '0.1)')}`} color={item.color} rounded="xl">
                                        <item.icon size={20} />
                                    </Box>
                                    <VStack align="start" gap={0} flex={1}>
                                        <HStack>
                                            <Text fontWeight="bold" color="fg.primary">{item.label}</Text>
                                            <Badge size="xs" variant="subtle" colorPalette="gray" textTransform="uppercase" fontSize="9px">
                                                {item.category}
                                            </Badge>
                                        </HStack>
                                        <Text fontSize="xs" color="fg.muted" truncate maxW="300px">{item.description}</Text>
                                    </VStack>
                                    <LuSearch className="opacity-0 group-hover:opacity-100" size={14} />
                                </HStack>
                            ))
                        ) : (
                            <Flex direction="column" align="center" justify="center" py={12} color="fg.muted">
                                <LuSearch size={32} opacity={0.2} />
                                <Text mt={4} fontWeight="medium">No pages found matching your search</Text>
                            </Flex>
                        )}
                    </VStack>
                </DialogBody>
                <DialogCloseTrigger />
            </DialogContent>
        </DialogRoot>
    );
};

export default QuickSwitcher;
