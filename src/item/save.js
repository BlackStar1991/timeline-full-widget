import { useBlockProps, RichText, InnerBlocks } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import { getComputedRel } from './utils';

export default function Save( { attributes } ) {
	const {
		align,
		title,
		titleTag,
		linkUrl,
		linkTarget,
		rel,
		position,
		showImages,
		image_id,
		image_url,
		image_alt,
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
						{ showImages && image_url && (
							<div
								className={ `timeline_pic ${
									isBlobURL( image_url )
										? 'image-loading'
										: 'loaded'
								}` }
							>
								<img
									id={ `img_${ image_id }` }
									src={ image_url }
									alt={ image_alt }
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
							/>
						) }
						<div className="tl-desc-short">
							<InnerBlocks.Content />
						</div>
					</div>
				</div>
			</div>
		</li>
	);
}
