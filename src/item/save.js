// item/save.js
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	const {
		textAlignClass,
		position,
		showMarker,
		markerUnique,
		markerAlt,
		markerUrl,
		markerId,
	} = attributes;

	const classes = [ 'timeline-item', position ];
	if ( textAlignClass ) {
		classes.push( `t-text-align-${ textAlignClass }` );
	}

	const blockProps = useBlockProps.save( {
		className: Array.from( new Set( classes ) ).join( ' ' ),
	} );

	return (
		<li { ...blockProps }>
			<div className="tl-trigger"></div>
			{ showMarker && (
				<div
					className="tl-mark"
					id={ markerId ? `marker_${ markerId }` : undefined }
				>
					{ markerUnique && markerUrl && (
						<img src={ markerUrl } alt={ markerAlt || '' } />
					) }
				</div>
			) }
			<InnerBlocks.Content />
		</li>
	);
}
