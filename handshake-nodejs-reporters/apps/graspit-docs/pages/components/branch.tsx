import type { PointClickEventObject } from "highcharts";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
import React from "react";
import highContrastDark from "highcharts/themes/high-contrast-dark";

if (typeof Highcharts === "object") {
	highContrastDark(Highcharts);
	HighchartsSankey(Highcharts);
	HighchartsOrganization(Highcharts);
}

export default function BranchStructure() {
	const options: Highcharts.Options = {
		chart: {
			inverted: true,
			backgroundColor: "transparent",
		},
		title: {
			text: undefined,
		},
		series: [
			{
				type: "organization",
				name: "Branches",
				keys: ["from", "to"],
				cursor: "pointer",
				point: {
					events: {
						click: function (event: PointClickEventObject) {
							window.open(
								`https://github.com/RahulARanger/graspit/tree/${event.point.options.id}`,
								"_blank"
							);
						},
					},
				},
				data: [
					{
						from: "Wdio-Graspit",
						to: "Graspit-Reporters",
					},
					{ from: "Jest-Graspit", to: "Graspit-Reporters" },
					{ from: "Graspit-Commons", to: "Graspit-Reporters" },
					{ from: "Graspit-Server", to: "master" },
					{ from: "graspit-dashboard", to: "master" },
					{ from: "Graspit-Reporters", to: "master" },
					{ from: "docs", to: "master" },
				],

				levels: [
					{
						level: 0,
						color: "#74b72e",
						dataLabels: {
							color: "black",
						},
					},
					{
						level: 1,
						color: "#98bf64 ",
						dataLabels: {
							color: "black",
						},
					},
					{
						level: 2,
						color: "#466d1d",
					},
				],
				nodes: [
					{
						id: "master",
						description: "E2E Tests (sanity only)",
						name: "Master",
					},
					{
						id: "Graspit-Server",
						description: "Server & Sched.",
						column: 1,
						level: 1,
					},
					{
						id: "graspit-dashboard",
						name: "Graspit-Dashboard",
						column: 1,
						level: 1,
					},
					{
						id: "docs",
						name: "Docs",
						column: 4,
						level: 1,
					},
					{
						id: "Graspit-Reporters",
						description: "E2E Tests",
					},
					{
						id: "Graspit-Commons",
						description: "Simple Tests",
					},
					{
						id: "Wdio-Graspit",
						description: "E2E Tests",
					},
				],
				colorByPoint: false,
				nodeWidth: 65,
			},
		],
		tooltip: {
			outside: true,
		},
	};

	return (
		<HighchartsReact
			suppressHydrationWarning
			highcharts={Highcharts}
			options={options}
		/>
	);
}
