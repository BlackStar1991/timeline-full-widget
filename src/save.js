import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	const { lineColor, animationTimeline, animationTimelineColor } = attributes;

	return (
		<div
			{ ...useBlockProps.save( { className: 'timeline-wrapper' } ) }
			style={ {
				'--timeline-color': lineColor || '#F6F6F8',
				'--timeline-color-animation':
					animationTimelineColor || '#F37321',
			} }
		>
			{ animationTimeline && (
				<div className="timeline-line-animation"></div>
			) }
			<ul className="timeline">
				<InnerBlocks.Content />
			</ul>
		</div>
	);
}
