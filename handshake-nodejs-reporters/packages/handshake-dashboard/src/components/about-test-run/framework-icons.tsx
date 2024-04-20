import type { AvatarProps } from '@mantine/core';
import { Avatar, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import React from 'react';
import type { possibleFrameworks } from 'types/test-run-records';

export function FrameworksUsed(properties: {
    frameworks: possibleFrameworks[];
    size?: AvatarProps['size'];
}) {
    const links: ReactNode[] = [];

    for (const framework of properties.frameworks) {
        const key: string = framework.trim().toLowerCase();
        let source: string = '';

        switch (key) {
            case 'webdriverio': {
                source =
                    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4IiB2aWV3Qm94PSIwIDAgNjQgNjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+TG9nbyBSZWd1bGFyPC90aXRsZT4KICAgIDxnIGlkPSJMb2dvLVJlZ3VsYXIiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUiIGZpbGw9IiNFQTU5MDYiIHg9IjAiIHk9IjAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjUiPjwvcmVjdD4KICAgICAgICA8cGF0aCBkPSJNOCwxNiBMOCw0OCBMNiw0OCBMNiwxNiBMOCwxNiBaIE00MywxNiBDNTEuODM2NTU2LDE2IDU5LDIzLjE2MzQ0NCA1OSwzMiBDNTksNDAuODM2NTU2IDUxLjgzNjU1Niw0OCA0Myw0OCBDMzQuMTYzNDQ0LDQ4IDI3LDQwLjgzNjU1NiAyNywzMiBDMjcsMjMuMTYzNDQ0IDM0LjE2MzQ0NCwxNiA0MywxNiBaIE0yNywxNiBMMTQuMTA2LDQ3Ljk5OTIwNzggTDExLjk5OSw0Ny45OTkyMDc4IEwyNC44OTQsMTYgTDI3LDE2IFogTTQzLDE4IEMzNS4yNjgwMTM1LDE4IDI5LDI0LjI2ODAxMzUgMjksMzIgQzI5LDM5LjczMTk4NjUgMzUuMjY4MDEzNSw0NiA0Myw0NiBDNTAuNzMxOTg2NSw0NiA1NywzOS43MzE5ODY1IDU3LDMyIEM1NywyNC4yNjgwMTM1IDUwLjczMTk4NjUsMTggNDMsMTggWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg==';
                break;
            }
            case 'mocha': {
                source =
                    'https://camo.githubusercontent.com/b997b9b1b7c78519ecd19dff214a8574d6f1312bbd6e85a202208bad20037bc5/68747470733a2f2f636c6475702e636f6d2f78465646784f696f41552e737667';
                break;
            }
            case 'cucumber': {
                source =
                    'https://user-images.githubusercontent.com/102477169/187096400-3b052fba-e2d7-45a7-b820-a09447a11d52.svg';
                break;
            }
            case 'jasmine': {
                source =
                    'https://avatars.githubusercontent.com/u/4624349?s=48&v=4';
                break;
            }
        }

        links.push(
            source ? (
                <Tooltip
                    label={key.at(0)?.toUpperCase() + key.slice(1)}
                    color="orange.7"
                >
                    <Avatar
                        size={properties.size ?? 'md'}
                        radius="xl"
                        src={source}
                        key={key}
                        aria-label={`${key}-avatar`}
                        alt={framework}
                    />
                </Tooltip>
            ) : (
                <Tooltip color="red" label={key}>
                    <Avatar
                        size={properties.size ?? 'md'}
                        radius={'xl'}
                        src={source}
                        key={key}
                        alt={framework}
                        color="red"
                    />
                </Tooltip>
            ),
        );
    }
    return links.length > 0 ? (
        <Avatar.Group>{links}</Avatar.Group>
    ) : (
        <Tooltip label="No Frameworks were configured" color="red">
            <Avatar
                size={properties.size ?? 'md'}
                radius={'xl'}
                src={''}
                alt={'No Frameworks used.'}
                color="red"
            />
        </Tooltip>
    );
}
