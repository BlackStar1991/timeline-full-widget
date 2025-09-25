import {
	RichText,
	BlockControls,
	AlignmentToolbar,
	LinkControl,
} from '@wordpress/block-editor';

import { Popover, ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { link as linkIcon } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { getSafeLinkAttributes, buildStyleObject } from '../utils';

export default function Title({
	clientId,
	title,
	titleTag,
	titleAlign,
	titleInlineStyle,
	titleFontSize,
	titleFontWeight,
	titleMarginTop,
	titleMarginBottom,
	titleColor,
	linkUrl,
	linkTarget,
	rel,
	setAttributes,
}) {
	const [isFocused, setIsFocused] = useState(false);
	const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);

	const selectedBlockClientId = useSelect((select) =>
		select('core/block-editor').getSelectedBlockClientId()
	);
	const blockIsSelected = selectedBlockClientId === clientId;
	const handleBlur = () => {
		setTimeout(() => setIsFocused(false), 150);
	};

	const styleObj = useMemo(
		() =>
			buildStyleObject({
				titleInlineStyle,
				titleFontSize,
				titleFontWeight,
				titleMarginTop,
				titleMarginBottom,
				titleColor,
			}),
		[
			titleInlineStyle,
			titleFontSize,
			titleFontWeight,
			titleMarginTop,
			titleMarginBottom,
			titleColor,
		]
	);

	const linkPopover = useMemo(() => {
		if (!isLinkPickerOpen) return null;
		return (
			<Popover
				position="bottom center"
				onClose={() => setIsLinkPickerOpen(false)}
			>
				<LinkControl
					value={{
						url: linkUrl,
						opensInNewTab: linkTarget === '_blank',
						rel,
					}}
					settings={[
						{
							id: 'opensInNewTab',
							title: __(
								'Open in new tab',
								'timeline-full-widget'
							),
						},
						{
							id: 'rel',
							title: __(
								'Add rel attribute',
								'timeline-full-widget'
							),
						},
					]}
					onChange={(newVal) => {
						const linkAttrs = getSafeLinkAttributes(
							newVal.url,
							newVal.rel,
							newVal.opensInNewTab ? '_blank' : ''
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
			<BlockControls>
				{titleTag === 'a' && (
					<ToolbarGroup>
						<ToolbarButton
							icon={linkIcon}
							label={__('Edit link', 'timeline-full-widget')}
							onClick={() => setIsLinkPickerOpen((p) => !p)}
							isPressed={isLinkPickerOpen}
						/>
					</ToolbarGroup>
				)}

				{(isFocused || blockIsSelected) && (
					<AlignmentToolbar
						value={titleAlign}
						onChange={(newAlign) =>
							setAttributes({ titleAlign: newAlign || 'left' })
						}
					/>
				)}
			</BlockControls>

			{linkPopover}

			{titleTag === 'a' ? (
				<RichText
					tagName="a"
					className={`t-text-align-${titleAlign} tl-title`}
					value={title}
					allowedFormats={[]}
					onChange={(val) => setAttributes({ title: val })}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					style={styleObj}
				/>
			) : (
				<RichText
					tagName={titleTag || 'h3'}
					className={`t-text-align-${titleAlign} tl-title`}
					value={title}
					allowedFormats={[]}
					onChange={(val) => setAttributes({ title: val })}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					style={styleObj}
				/>
			)}
		</>
	);
}
