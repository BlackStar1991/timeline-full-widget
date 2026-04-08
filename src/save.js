import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { convertMarginAttrToStyle } from './item/utils';

export default function Save({ attributes }) {
	const {
		lineColor,
		markerColor,
		animationTimeline,
		animationLineColor,
		showMarker,
		animationMarker,
		animationMarkerColor,
		animationOtherSideSticky,
	} = attributes;

	const hasAnimatedMarkers =
		showMarker && animationTimeline && animationMarker;

	const marginStyle = convertMarginAttrToStyle(attributes.style);
	const blockProps = useBlockProps.save({ style: marginStyle });

	return (
		<div {...blockProps}>
			<div
				className="timeline-wrapper"
				style={{
					'--timeline-line-color': lineColor || '#F6F6F8',
					'--timeline-marker-color': markerColor || '#F6F6F8',
					'--timeline-line-active-color':
						animationLineColor || '#F37321',
					'--timeline-marker-active-color':
						animationMarkerColor || '#F37321',
				}}
			>
				{animationTimeline && (
					<div className="timeline-line-animation"></div>
				)}

				<ul
					className={[
						'timeline',
						hasAnimatedMarkers && 'timeline-animation-marker',
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
