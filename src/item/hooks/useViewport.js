import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Return: 'desktop' | 'tablet' | 'mobile'
 */
export default function useViewport() {
    const editorDevice = useSelect((select) => {
        const editPost = select('core/editor');
        const editSite = select('core/edit-site');

        const store = editPost || editSite;

        if (store?.__experimentalGetPreviewDeviceType) {
            return store.__experimentalGetPreviewDeviceType();
        }

        return null;
    }, []);

    const mapEditorDevice = (device) => {
        switch (device) {
            case 'Tablet':
                return 'tablet';
            case 'Mobile':
                return 'mobile';
            case 'Desktop':
            default:
                return 'desktop';
        }
    };

    const getFrontendDevice = () => {
        if (typeof window === 'undefined') {
            return 'desktop';
        }

        if (window.matchMedia('(max-width: 767px)').matches) {
            return 'mobile';
        }

        if (window.matchMedia('(max-width: 1024px)').matches) {
            return 'tablet';
        }

        return 'desktop';
    };


    const [device, setDevice] = useState(() => {
        return editorDevice
            ? mapEditorDevice(editorDevice)
            : getFrontendDevice();
    });

    useEffect(() => {
        if (editorDevice) {
            setDevice(mapEditorDevice(editorDevice));
            return;
        }

        const onResize = () => setDevice(getFrontendDevice());

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [editorDevice]);

    return device;
}
