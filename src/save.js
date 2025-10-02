import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { convertMarginAttrToStyle } from './item/utils';

export default function Save({ attributes }) {
	const {
		lineColor,
		animationTimeline,
		animationTimelineColor,
		animationMarker,
	} = attributes;

	const marginStyle = convertMarginAttrToStyle(attributes.style);
	const blockProps = useBlockProps.save({ style: marginStyle });

	return (
		<div {...blockProps}>
			<div
				className="timeline-wrapper"
				style={{
					'--timeline-color': lineColor || '#F6F6F8',
					'--timeline-color-animation':
						animationTimelineColor || '#F37321',
				}}
			>
				{animationTimeline && (
					<div className="timeline-line-animation"></div>
				)}

				<ul
					className={
						animationMarker
							? 'timeline-animation-marker timeline'
							: 'timeline'
					}
				>
					<InnerBlocks.Content />
				</ul>
			</div>
		</div>
	);
}
