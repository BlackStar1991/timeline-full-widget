import { useBlockProps, RichText, InnerBlocks } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import { getComputedRel } from './utils';

export default function Save( { attributes } ) {
	const {
		align,
		title,
		titleTag,
		titleColor,
		descriptionColor,
		linkUrl,
		linkTarget,
		rel,
		position,
		showImages,
		imageId,
		imageUrl,
		imageAlt,
	} = attributes;

	const blockProps = useBlockProps.save( {
		className: `${ position } ${
			align ? `has-text-align-${ align }` : ''
		}`,
	} );

	return (
		<li { ...blockProps }>
			<div className="timeline-side"></div>
			<div className="tl-trigger"></div>
			<div className="tl-circ"></div>
			<div className="timeline-panel">
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
								href={ linkUrl || undefined }
								target={ linkTarget || undefined }
								rel={ rel || undefined }
							/>
						) : (
							<RichText.Content
								tagName={ titleTag }
								className="tl-title"
								value={ title }
								{ ...( titleColor
									? { style: { color: titleColor } }
									: {} ) }
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
