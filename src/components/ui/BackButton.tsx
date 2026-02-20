import { Link } from 'react-router';
import { Button, Text } from '@chakra-ui/react';
import { LuArrowLeft } from 'react-icons/lu';

interface BackButtonProps {
    to?: string;
    label?: string;
}

export const BackButton = ({ to, label = 'Back', onClick }: BackButtonProps & { onClick?: () => void }) => {
    const ButtonContent = (
        <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ color: "fg.primary", bg: "bg.subtle" }}
            px={0}
            gap={1}
            onClick={onClick}
        >
            <LuArrowLeft />
            <Text fontSize="sm" fontWeight="medium">{label}</Text>
        </Button>
    );

    if (onClick) {
        return ButtonContent;
    }

    return (
        <Link to={to || '..'}>
            {ButtonContent}
        </Link>
    );
};
