import Steps from "antd/lib/steps/index";
import Link from "antd/lib/typography/Link";

function stepStatus(forThis: number, current?: number) {
	if (current == null) return "wait";
	return current === forThis
		? "process"
		: current < forThis
		? "wait"
		: "finish";
}

export default function SetupSteps(props: { current?: number }) {
	return (
		<Steps
			style={{ marginTop: "20px" }}
			current={props.current}
			items={[
				{
					title: <Link href="./server">Graspit Server</Link>,
					description: "Downloading Python & graspit package",
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
