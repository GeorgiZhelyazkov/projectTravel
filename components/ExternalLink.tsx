import { Linking, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ExternalLinkProps extends TouchableOpacityProps {
  href: string;
}

export function ExternalLink({ href, ...props }: ExternalLinkProps) {
  return (
    <TouchableOpacity
      {...props}
      onPress={() => {
        Linking.openURL(href);
      }}
    />
  );
} 