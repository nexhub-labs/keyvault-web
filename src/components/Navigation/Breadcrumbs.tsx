import { Box, HStack, Text } from '@chakra-ui/react';
import { useLocation, Link } from 'react-router';
import { LuChevronRight } from 'react-icons/lu';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    return (
        <HStack gap={2} mb={6} color="fg.muted" fontSize="sm" fontWeight="medium" wrap="wrap">
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <Text _hover={{ color: "fg.primary" }} transition="color 0.2s">Dashboard</Text>
            </Link>

            {pathnames.map((name, index) => {
                if (name === 'dashboard') return null;

                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const label = name.charAt(0) + name.slice(1).replace(/-/g, ' ');

                return (
                    <HStack key={routeTo} gap={2}>
                        <LuChevronRight size={14} opacity={0.5} />
                        {isLast ? (
                            <Text color="fg.primary" fontWeight="bold" textTransform="capitalize">{label}</Text>
                        ) : (
                            <Link to={routeTo} style={{ textDecoration: 'none' }}>
                                <Text _hover={{ color: "fg.primary" }} transition="color 0.2s" textTransform="capitalize">{label}</Text>
                            </Link>
                        )}
                    </HStack>
                );
            })}
        </HStack>
    );
};

export default Breadcrumbs;
