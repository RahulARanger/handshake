import { type Dayjs } from "dayjs";
import React, { type CSSProperties, type ReactNode } from "react";
import RelativeTo, {
    HumanizeDuration,
} from "@/components/Datetime/relativeTime";
import { type Duration } from "dayjs/plugin/duration";
import { type statusOfEntity } from "@/types/detailedTestRunPage";
import CheckCircleFilled from "@ant-design/icons/CheckCircleFilled";
import CloseOutlined from "@ant-design/icons/CloseOutlined";
import WarningFilled from "@ant-design/icons/WarningFilled";
import Icon from "@ant-design/icons";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import { type possibleBrowserNames } from "@/types/testEntityRelated";
import Chrome from "../../public/chrome.svg";
import Firefox from "../../public/firefox.svg";
import QuestionOutlined from "@ant-design/icons/lib/icons/QuestionOutlined";

export default function RenderTimeRelativeToStart(props: {
    value?: [Dayjs, Dayjs];
    style?: CSSProperties;
}): ReactNode {
    if (props.value == null) return <></>;
    return (
        <RelativeTo
            dateTime={props.value[0]}
            wrt={props.value[1]}
            style={props.style}
        />
    );
}

export function RenderDuration(props: {
    value: Duration;
    style?: CSSProperties;
}): ReactNode {
    return <HumanizeDuration duration={props.value} style={props.style} />;
}

export function RenderStatus(props: { value: statusOfEntity }): ReactNode {
    switch (props.value) {
        case "PASSED": {
            return (
                <CheckCircleFilled
                    style={{ fontSize: "16px", color: "green" }}
                    title="Passed"
                />
            );
        }
        case "FAILED": {
            return (
                <CloseOutlined
                    spin
                    style={{ fontSize: "16px", color: "red" }}
                    title="Failed"
                />
            );
        }
        case "SKIPPED": {
            return (
                <WarningFilled
                    style={{ fontSize: "16px", color: "yellow" }}
                    spin
                    title="Skipped"
                />
            );
        }
        case "PENDING": {
            return (
                <LoadingOutlined
                    style={{ fontSize: "16px", color: "yellow" }}
                    title="Pending"
                />
            );
        }
    }
}

export function RenderBrowserType(props: {
    browserName: possibleBrowserNames;
}): ReactNode {
    switch (props.browserName) {
        case "chrome": {
            return <Icon component={Chrome} />;
        }
        case "firefox": {
            return <Icon component={Firefox} />;
        }
        default: {
            return <QuestionOutlined />;
        }
    }
}
