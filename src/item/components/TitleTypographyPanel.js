// item/components/TitleTypographyPanel.js
import { PanelBody, SelectControl, RangeControl } from '@wordpress/components';
import { FontSizePicker } from '@wordpress/block-editor';
import FontFamilySelect from './FontFamilySelect';
import { __ } from '@wordpress/i18n';

export default function TitleTypographyPanel({ attrs = {}, setAttributes }) {
	const {
		titleFontSize,
		titleFontWeight,
		titleMarginTop,
		titleMarginBottom,
		titleLineHeight,
		titleFontFamily,
	} = attrs;

	return (
		<PanelBody
			title={__('Title Typography', 'timeline-full-widget')}
			initialOpen={true}
		>
			<FontSizePicker
				fontSizes={[
					{ name: 'Small', size: 12, slug: 'small' },
					{ name: 'Normal', size: 16, slug: 'normal' },
					{ name: 'Big', size: 26, slug: 'big' },
				]}
				value={titleFontSize ? parseFloat(titleFontSize) : undefined}
				onChange={(newSize) => {
					if (newSize === undefined) {
						setAttributes({
							titleFontSize: '22',
							titleFontUnit: 'px',
						});
						return;
					}
					setAttributes({
						titleFontSize: String(newSize),
						titleFontUnit: 'px',
					});
				}}
				withSlider
			/>

			<SelectControl
				label={__('Title font weight', 'timeline-full-widget')}
				value={titleFontWeight || ''}
				options={[
					{ label: __('Default', 'timeline-full-widget'), value: '' },
					{ label: '100', value: '100' },
					{ label: '200', value: '200' },
					{ label: '300', value: '300' },
					{ label: '400', value: '400' },
					{ label: '500', value: '500' },
					{ label: '600', value: '600' },
					{ label: '700', value: '700' },
					{ label: '800', value: '800' },
					{ label: '900', value: '900' },
				]}
				onChange={(value) => setAttributes({ titleFontWeight: value })}
			/>

			<FontFamilySelect
				value={titleFontFamily}
				onChange={(val) => setAttributes({ titleFontFamily: val })}
			/>

			<RangeControl
				label={__('Margin Top (px)', 'timeline-full-widget')}
				value={Number(titleMarginTop) || 0}
				onChange={(value) =>
					setAttributes({ titleMarginTop: String(value) })
				}
				min={0}
				max={100}
			/>
			<RangeControl
				label={__('Margin Bottom (px)', 'timeline-full-widget')}
				value={Number(titleMarginBottom) || 0}
				onChange={(value) =>
					setAttributes({ titleMarginBottom: String(value) })
				}
				min={0}
				max={100}
			/>
			<RangeControl
				label={__('Title Line Height (px)', 'timeline-full-widget')}
				value={Number(titleLineHeight)}
				onChange={(value) =>
					setAttributes({ titleLineHeight: String(value) })
				}
			/>
		</PanelBody>
	);
}
