import React from "react";
import Steps from "antd/lib/steps/index";
import Link from "antd/lib/typography/Link";

function stepStatus(forThis: number, current?: number) {
	if (current == null) return "wait";
	if (current === forThis) return "process";
	return current < forThis ? "wait" : "finish";
}

export default function SetupSteps(props: { current?: number }) {
	return (
		<Steps
			style={{ marginTop: "20px" }}
			current={props.current}
			items={[
				{
					title: <Link href="./check">Check</Link>,
					description:
						"Check if there's direct reporter available for your framework",
					status: stepStatus(0, props.current),
				},
				{
					title: <Link href="./plugins">Related Plugin</Link>,
					description:
						"Custom Reporter for your Test Automation framework",
					status: stepStatus(1, props.current),
				},

				{
					title: <Link href="./dashboard">Graspit Dashboard</Link>,
					description: "Setup for graspit dashboard",
					status: stepStatus(2, props.current),
				},
			]}
		/>
	);
}
