import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { convertMarginAttrToStyle } from './item/utils';

export default function Save({ attributes }) {
	const {
		lineColor,
		animationTimeline,
		animationTimelineColor,
		animationMarker,
		animationOtherSideSticky,
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
					className={[
						'timeline',
						animationMarker && 'timeline-animation-marker',
						animationOtherSideSticky &&
							'timeline-animation-other-side-sticky',
					]
						.filter(Boolean)
						.join(' ')}
				>
					<InnerBlocks.Content />
				</ul>
			</div>
		</div>
	);
}
