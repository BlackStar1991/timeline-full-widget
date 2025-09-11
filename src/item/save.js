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
        titleFontWeight,
        titleAlign,
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
		otherSiteTitle,
		showOtherSide,
        sideTextAlign,
	} = attributes;

	const classes = [ 'timeline-item', position ];
	if ( textAlignClass ) classes.push( `t-text-align-${ textAlignClass }` );
	const className = Array.from( new Set( classes ) ).join( ' ' );
	const linkProps = getSafeLinkAttributes( linkUrl, rel, linkTarget );
	const styleObj = buildStyleObject( {
		titleInlineStyle: titleInlineStyle,
		titleFontSize: titleFontSize,
        titleFontWeight: titleFontWeight,
		titleMarginTop: titleMarginTop,
		titleMarginBottom: titleMarginBottom,
		titleColor: titleColor,
	} );

	return (
		<li className={ className }>
			<div className="timeline-side">
				{ showOtherSide && (
					<RichText.Content
						tagName="p"
                        className={ `t-text-align-${ sideTextAlign } ` }
						value={ otherSiteTitle }
						style={ styleObj }
					/>
				) }
			</div>
			<div className="tl-trigger"></div>
			<div className="tl-circ"></div>
			<div
				className="timeline-panel"
				{ ...( itemBackgroundColor
					? {
							style: {
								backgroundColor: itemBackgroundColor,
							},
					  }
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
                                className={ `t-text-align-${ titleAlign } tl-title` }
								value={ title }
								{ ...linkProps }
								style={ styleObj }
							/>
						) : (
							<RichText.Content
								tagName={ titleTag }
                                className={ `t-text-align-${ titleAlign } tl-title` }
								value={ title }
								style={ styleObj }
							/>
						) }

						<div
							className="tl-desc-short"
							{ ...( descriptionColor
								? { style: { color: descriptionColor } }
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
