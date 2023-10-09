import GalleryOfImages, {
	CardForAImage,
} from "graspit/src/components/utils/ImagesWithThumbnails";
import type { Attachment } from "graspit/src/types/testEntityRelated";

import type { ReactNode } from "react";
import React from "react";

export default function PreviewForMotivation(props: {
	images: Array<{ title: string; url: string }>;
}): ReactNode {
	const imagesToAttachments: Attachment[] = props.images.map((image) => ({
		attachmentValue: JSON.stringify({
			title: image.title,
			value: image.url,
		}),
		description: "",
		entity_id: "",
		type: "CUSTOM",
	}));

	return (
		<GalleryOfImages>
			{imagesToAttachments.map((image, index) => (
				<CardForAImage key={index} index={index} image={image} isRaw />
			))}
		</GalleryOfImages>
	);
}
