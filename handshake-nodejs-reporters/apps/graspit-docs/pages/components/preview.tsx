import GalleryOfImages, {
	CardForAImage,
} from "graspit/src/components/utils/images-with-thumbnails";

import type { ReactNode } from "react";
import React from "react";

export default function PreviewForMotivation(props: {
	images: Array<{ title: string; url: string }>;
}): ReactNode {
	return (
		<GalleryOfImages>
			{props.images.map((image, index) => (
				<CardForAImage
					key={index}
					index={index}
					url={image.url}
					title={image.title}
				/>
			))}
		</GalleryOfImages>
	);
}
