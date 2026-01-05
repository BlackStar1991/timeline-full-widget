// item/components/FontFamilySelect.js
import { SelectControl } from '@wordpress/components';
import useFontsFromSettings from '../hooks/useFontsFromSettings';
import { __ } from '@wordpress/i18n';

export default function FontFamilySelect({ value, onChange }) {
	const fonts = useFontsFromSettings();

	return (
		<SelectControl
			label={__('Title font family', 'timeline-full-widget')}
			value={value || ''}
			options={[
				{ label: __('Default', 'timeline-full-widget'), value: '' },
				...(Array.isArray(fonts)
					? fonts.map((f) => ({ label: f.name, value: f.value }))
					: []),
			]}
			onChange={onChange}
			__next40pxDefaultSize={true}
			__nextHasNoMarginBottom={true}
		/>
	);
}
