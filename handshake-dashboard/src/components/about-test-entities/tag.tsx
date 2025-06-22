import { Badge, BadgeProps, Tooltip } from "@mantine/core";
import { Tag } from "types/test-entity-related";

export default function TagComp(properties: { tag: Tag, size?: BadgeProps["p"] }) {
    const tag = properties.tag
    return <Tooltip
        key={tag.label}
        label={tag.desc}
        color="cyan"
    >
        <Badge
            size="sm"
            variant="light"
            color="cyan.9"
            p={properties.size ?? "md"}
        >
            {tag.label}
        </Badge>
    </Tooltip>
}