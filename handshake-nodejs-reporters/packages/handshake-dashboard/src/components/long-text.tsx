import { Text, TextProps, Tooltip } from '@mantine/core';

export default function ShowLongText(properties: TextProps & { text: string }) {
    const { text, ...rest } = properties;
    return (
        <Tooltip label={text} color="orange">
            <Text {...rest}>{text}</Text>
        </Tooltip>
    );
}
