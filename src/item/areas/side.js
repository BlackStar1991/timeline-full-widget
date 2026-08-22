import { registerBlockType } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	InnerBlocks,
	useBlockProps,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

registerBlockType( 'za/timeline-item-side', {
	apiVersion: 3,
	title: __( 'Timeline side content', 'timeline-full-widget' ),
	description: __(
		'Container for blocks displayed on the side of a timeline item.',
		'timeline-full-widget'
	),
	icon: 'editor-kitchensink',
	parent: [ 'za/timeline-item' ],
	supports: {
		html: false,
		reusable: false,
		inserter: false,
	},
	attributes: {
		showOtherSide: {
			type: 'boolean',
			default: true,
		},
		sideTextAlign: {
			type: 'string',
			default: 'left',
		},
	},
	edit: ( { clientId, attributes, setAttributes } ) => {
		const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
		const { parentClientId, parentAttributes } = useSelect(
			( select ) => {
				const editor = select( 'core/block-editor' );
				const currentParentClientId = editor.getBlockRootClientId( clientId );

				return {
					parentClientId: currentParentClientId,
					parentAttributes: currentParentClientId
						? editor.getBlock( currentParentClientId )?.attributes || {}
						: {},
				};
			},
			[ clientId ]
		);

		const setSideAttributes = useCallback(
			( nextAttributes ) => {
				setAttributes( nextAttributes );

				if ( parentClientId ) {
					updateBlockAttributes( parentClientId, nextAttributes );
				}
			},
			[ parentClientId, setAttributes, updateBlockAttributes ]
		);

		const showOtherSide =
			parentAttributes.showOtherSide ?? attributes.showOtherSide;
		const sideTextAlign =
			parentAttributes.sideTextAlign || attributes.sideTextAlign || 'left';

		const blockProps = useBlockProps( {
			className: `timeline-side t-text-align-${ sideTextAlign }`,
		} );

		return (
			<>
				<BlockControls group="block">
					<AlignmentToolbar
						value={ sideTextAlign }
						onChange={ ( newAlign ) =>
							setSideAttributes( {
								sideTextAlign: newAlign || 'left',
							} )
						}
					/>
				</BlockControls>

				<div { ...blockProps }>
					{ showOtherSide && (
						<InnerBlocks
							template={ [
								[
									'core/paragraph',
									{
										placeholder: __(
											'Add side content',
											'timeline-full-widget'
										),
									},
								],
							] }
							templateLock={ false }
							renderAppender={ InnerBlocks.ButtonBlockAppender }
						/>
					) }
				</div>
			</>
		);
	},
	save: ( { attributes } ) => {
		const { showOtherSide = true, sideTextAlign = 'left' } = attributes;
		const blockProps = useBlockProps.save( {
			className: `timeline-side t-text-align-${ sideTextAlign }`,
		} );

		return (
			<div { ...blockProps }>
				{ showOtherSide && <InnerBlocks.Content /> }
			</div>
		);
	},
} );
