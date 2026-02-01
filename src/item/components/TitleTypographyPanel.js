// item/components/TitleTypographyPanel.js
import { PanelBody, SelectControl, RangeControl } from '@wordpress/components';
import { FontSizePicker } from '@wordpress/block-editor';
import FontFamilySelect from './FontFamilySelect';
import { __ } from '@wordpress/i18n';
import useViewport from '../hooks/useViewport';
import { normalizeResponsive } from '../utils/normalizeResponsive';

export default function TitleTypographyPanel({ attrs = {}, setAttributes }) {
	const {
		titleFontSize,
		titleFontUnit,
		titleFontWeight,
		titleMarginTop,
		titleMarginBottom,
		titleLineHeight,
		titleFontFamily,
	} = attrs;

	const device = useViewport();

	const normalizedFontSize = normalizeResponsive(titleFontSize, {
		desktop: 22,
	});

	const currentValue =
		normalizedFontSize[device] != null
			? normalizedFontSize[device]
			: undefined;

	return (
		<PanelBody
			title={__('Title Typography', 'timeline-full-widget')}
			initialOpen={true}
		>
			<FontSizePicker
				value={currentValue}
				onChange={(newSize) => {
					setAttributes({
						titleFontSize: {
							...normalizedFontSize,
							[device]: newSize ?? null,
						},
					});
				}}
				__next40pxDefaultSize={true}
				__nextHasNoMarginBottom={true}
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
				__next40pxDefaultSize={true}
				__nextHasNoMarginBottom={true}
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
				__nextHasNoMarginBottom={true}
				__next40pxDefaultSize={true}
			/>
			<RangeControl
				label={__('Margin Bottom (px)', 'timeline-full-widget')}
				value={Number(titleMarginBottom) || 0}
				onChange={(value) =>
					setAttributes({ titleMarginBottom: String(value) })
				}
				min={0}
				max={100}
				__nextHasNoMarginBottom={true}
				__next40pxDefaultSize={true}
			/>
			<RangeControl
				label={__('Title Line Height (px)', 'timeline-full-widget')}
				value={Number(titleLineHeight)}
				onChange={(value) =>
					setAttributes({ titleLineHeight: String(value) })
				}
				__nextHasNoMarginBottom={true}
				__next40pxDefaultSize={true}
			/>
		</PanelBody>


	);
}
