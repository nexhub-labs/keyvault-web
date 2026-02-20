import { Box, BoxProps } from '@chakra-ui/react';

export interface AuthCardProps extends BoxProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const AuthCard = ({ children, title, description, ...props }: AuthCardProps) => {
  return (
    <Box
      bg="bg.surface"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="2xl"
      p={{ base: 6, md: 8 }}
      shadow="xl"
      backdropFilter="blur(2xl)"
      position="relative"
      overflow="hidden"
      {...props}
    >
      {title && (
        <Box mb={6}>
          <Box
            as="h2"
            fontSize="2xl"
            fontWeight="bold"
            color="fg.primary"
            textAlign="center"
            letterSpacing="tight"
          >
            {title}
          </Box>
          {description && (
            <Box
              fontSize="sm"
              color="fg.muted"
              textAlign="center"
              mt={2}
            >
              {description}
            </Box>
          )}
        </Box>
      )}

      {children}
    </Box>
  );
};
