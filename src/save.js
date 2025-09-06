import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	return (
		<div { ...useBlockProps.save( { className: 'timeline-wrapper' } ) }>
			<div className="timeline-line-animation"></div>
			<ul
				className="timeline"
				style={ { '--timeline-color': attributes.lineColor } }
			>
				<InnerBlocks.Content />
			</ul>
		</div>
	);
}
