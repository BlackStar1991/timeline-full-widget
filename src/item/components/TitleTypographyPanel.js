// item/components/TitleTypographyPanel.js
import {
	PanelBody,
	SelectControl,
	__experimentalBoxControl as BoxControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { FontSizePicker } from '@wordpress/block-editor';
import FontFamilySelect from './FontFamilySelect';
import { __ } from '@wordpress/i18n';
import useViewport from '../hooks/useViewport';
import { normalizeResponsive } from '../utils/normalizeResponsive';

const PX_ONLY_UNITS = [{ value: 'px', label: 'px' }];
const LETTER_SPACING_UNITS = [
	{ value: 'px', label: 'px' },
	{ value: 'em', label: 'em' },
	{ value: 'rem', label: 'rem' },
];
const LINE_HEIGHT_UNITS = [
	{ value: '', label: '—' },
	{ value: 'px', label: 'px' },
	{ value: 'em', label: 'em' },
	{ value: 'rem', label: 'rem' },
];

function normalizeSpacingValue(value, fallback = '') {
	if (value === undefined || value === null) {
		return fallback;
	}

	const normalized = String(value).trim();
	return normalized === '' ? fallback : normalized;
}

export default function TitleTypographyPanel({ attrs = {}, setAttributes }) {
	const {
		titleFontSize,
		titleFontWeight,
		titleMarginTop,
		titleMarginBottom,
		titleLineHeight,
		titleFontFamily,
		titleLetterSpacing,
	} = attrs;

	const device = useViewport();

	// Font size <=58px otherwise incorrect styles
	const normalizedFontSize = normalizeResponsive(titleFontSize, {
		desktop: 22,
	});

	const currentValue =
		normalizedFontSize[device] !== null
			? normalizedFontSize[device]
			: undefined;

	const boxValues = {
		top: normalizeSpacingValue(titleMarginTop, '10px'),
		bottom: normalizeSpacingValue(titleMarginBottom, '0px'),
	};

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
					{ label: __('Default', 'timeline-full-widget'), value: '700' },
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

			<UnitControl
				label={__('Title line height', 'timeline-full-widget')}
				value={titleLineHeight || ''}
				onChange={(value) =>
					setAttributes({ titleLineHeight: value || '' })
				}
				units={LINE_HEIGHT_UNITS}
				step={0.1}
				isPressEnterToChange
				__next40pxDefaultSize={true}
				__nextHasNoMarginBottom={true}
			/>

			<UnitControl
				label={__('Title letter spacing', 'timeline-full-widget')}
				value={titleLetterSpacing || ''}
				onChange={(value) =>
					setAttributes({ titleLetterSpacing: value || '' })
				}
				units={LETTER_SPACING_UNITS}
				step={0.1}
				isPressEnterToChange
				__next40pxDefaultSize={true}
				__nextHasNoMarginBottom={true}
			/>

			<BoxControl
				label={__('Title margins', 'timeline-full-widget')}
				values={boxValues}
				onChange={(nextValues = {}) => {
					setAttributes({
						titleMarginTop: normalizeSpacingValue(
							nextValues.top,
							'10px'
						),
						titleMarginBottom: normalizeSpacingValue(
							nextValues.bottom,
							'0px'
						),
					});
				}}
				units={PX_ONLY_UNITS}
				sides={['top', 'bottom']}
				resetValues={{ top: '10px', bottom: '0px' }}
				allowReset={true}
			/>
		</PanelBody>
	);
}
