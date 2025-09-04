import { RichText, InnerBlocks } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import { getSafeLinkAttributes, buildStyleObject } from './utils';

export default function Save( { attributes } ) {
	const {
		textAlignClass,
		title,
		titleTag,
		titleInlineStyle,
		titleColor,
		titleFontSize,
		titleMarginTop,
		titleMarginBottom,
		descriptionColor,
		itemBackgroundColor,
		linkUrl,
		linkTarget,
		rel,
		position,
		showImages,
		imageId,
		imageUrl,
		imageAlt,
	} = attributes;

	const classes = [ 'wp-block-za-timeline-item', position ];
	if ( textAlignClass ) classes.push( `t-text-align-${ textAlignClass }` );
	const className = Array.from( new Set( classes ) ).join( ' ' );
	const linkProps = getSafeLinkAttributes( linkUrl, rel, linkTarget );
	const styleObj = buildStyleObject( {
		titleInlineStyle: titleInlineStyle,
		titleFontSize: titleFontSize,
		titleMarginTop: titleMarginTop,
		titleMarginBottom: titleMarginBottom,
		titleColor: titleColor,
	} );

	return (
		<li className={ className }>
			<div className="timeline-side"></div>
			<div className="tl-trigger"></div>
			<div className="tl-circ"></div>
			<div
				className="timeline-panel"
				{ ...( itemBackgroundColor
					? { style: { color: itemBackgroundColor } }
					: {} ) }
			>
				<div className="tl-content">
					<div className="tl-desc">
						{ showImages && imageUrl && (
							<div
								className={ `timeline_pic ${
									isBlobURL( imageUrl )
										? 'image-loading'
										: 'loaded'
								}` }
							>
								<img
									id={ `img_${ imageId }` }
									src={ imageUrl }
									alt={ imageAlt }
								/>
							</div>
						) }

						{ titleTag === 'a' ? (
							<RichText.Content
								tagName="a"
								className="tl-title"
								value={ title }
								{ ...linkProps }
								style={ styleObj }
							/>
						) : (
							<RichText.Content
								tagName={ titleTag }
								className="tl-title"
								value={ title }
								style={ styleObj }
							/>
						) }

						<div
							className="tl-desc-short"
							{ ...( descriptionColor
								? {
										style: {
											backgroundColor: descriptionColor,
										},
								  }
								: {} ) }
						>
							<InnerBlocks.Content />
						</div>
					</div>
				</div>
			</div>
		</li>
	);
}
