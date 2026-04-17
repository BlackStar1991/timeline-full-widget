import {
	RichText,
	BlockControls,
	AlignmentToolbar,
	LinkControl,
} from '@wordpress/block-editor';
import { Popover, ToolbarButton } from '@wordpress/components';
import { link as linkIcon } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { getSafeLinkAttributes, buildStyleObject } from '../utils';
import useViewport from '../hooks/useViewport';
import {
	normalizeResponsive,
	resolveResponsiveValue,
} from '../utils/normalizeResponsive';

export default function Title({
	clientId,
	title,
	titleTag,
	titleAlign,
	titleInlineStyle,
	titleFontSize,
	titleFontUnit,
	titleFontWeight,
	titleMarginTop,
	titleMarginBottom,
	titleLineHeight,
	titleLetterSpacing,
	titleColor,
	titleFontFamily,
	linkUrl,
	linkTarget,
	rel,
	setAttributes,
	activeField,
	setActiveField,
}) {
	const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
	const device = useViewport();

	const normalizedFontSize = useMemo(
		() => normalizeResponsive(titleFontSize),
		[titleFontSize]
	);

	const resolvedFontSize = useMemo(
		() => resolveResponsiveValue(normalizedFontSize, device),
		[normalizedFontSize, device]
	);

	const selectedBlockClientId = useSelect(
		(select) => select('core/block-editor').getSelectedBlockClientId(),
		[]
	);

	const showAlignmentForTitle =
		activeField === 'title' && selectedBlockClientId === clientId;

	const styleObj = useMemo(
		() =>
			buildStyleObject({
				titleInlineStyle,
				titleFontSize: resolvedFontSize,
				titleFontUnit,
				titleFontWeight,
				titleLineHeight,
				titleLetterSpacing,
				titleMarginTop,
				titleMarginBottom,
				titleColor,
				titleFontFamily,
			}),
		[
			titleInlineStyle,
			resolvedFontSize,
			titleFontUnit,
			titleFontWeight,
			titleMarginTop,
			titleMarginBottom,
			titleLineHeight,
			titleLetterSpacing,
			titleColor,
			titleFontFamily,
		]
	);

	const linkPopover = useMemo(() => {
		if (!isLinkPickerOpen) {
			return null;
		}

		return (
			<Popover
				position="bottom center"
				onClose={() => setIsLinkPickerOpen(false)}
			>
				<LinkControl
					value={{
						url: linkUrl,
						opensInNewTab: linkTarget === '_blank',
					}}
					settings={[
						{
							id: 'opensInNewTab',
							title: __(
								'Open in new tab',
								'timeline-full-widget'
							),
						},
					]}
					onChange={(newVal) => {
						const linkAttrs = getSafeLinkAttributes(
							newVal?.url || '',
							rel || '',
							newVal?.opensInNewTab ? '_blank' : ''
						);

						setAttributes({
							linkUrl: linkAttrs.href,
							linkTarget: linkAttrs.target,
							rel: linkAttrs.rel,
						});
					}}
				/>
			</Popover>
		);
	}, [isLinkPickerOpen, linkUrl, linkTarget, rel, setAttributes]);

	return (
		<>
			<BlockControls group="block">
				{titleTag === 'a' && (
					<ToolbarButton
						icon={linkIcon}
						label={__('Edit link', 'timeline-full-widget')}
						onClick={() => setIsLinkPickerOpen((prev) => !prev)}
						isPressed={isLinkPickerOpen}
					/>
				)}

				{showAlignmentForTitle && (
					<AlignmentToolbar
						value={titleAlign}
						onChange={(newAlign) =>
							setAttributes({ titleAlign: newAlign || 'left' })
						}
					/>
				)}
			</BlockControls>

			{linkPopover}

			<RichText
				tagName={titleTag === 'a' ? 'a' : titleTag || 'h3'}
				className={`t-text-align-${titleAlign} tl-title`}
				value={title}
				allowedFormats={[]}
				onChange={(val) => setAttributes({ title: val })}
				onFocus={() => setActiveField('title')}
				style={styleObj}
			/>
		</>
	);
}
