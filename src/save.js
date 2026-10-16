import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { convertMarginAttrToStyle } from './item/utils';
import { getTimelineWrapperStyle } from './timeline-style';

export default function Save( { attributes } ) {
	const {
		animationTimeline,
		showMarker,
		animationMarker,
		animationOtherSideSticky,
		showStepNumbers,
	} = attributes;

	const hasAnimatedMarkers =
		showMarker && animationTimeline && animationMarker;

	const marginStyle = convertMarginAttrToStyle( attributes.style );
	const blockProps = useBlockProps.save( { style: marginStyle } );

	return (
		<div { ...blockProps }>
			<div
				className="timeline-wrapper"
				style={ getTimelineWrapperStyle( attributes ) }
			>
				{ animationTimeline && (
					<div className="timeline-line-animation"></div>
				) }

				<ul
					className={ [
						'timeline',
						hasAnimatedMarkers && 'timeline-animation-marker',
						animationOtherSideSticky && 'timeline-animation-other-side-sticky',
						showStepNumbers && 'timeline-numbers',
					]
						.filter( Boolean )
						.join( ' ' ) }
				>
					<InnerBlocks.Content />
				</ul>
			</div>
		</div>
	);
}
