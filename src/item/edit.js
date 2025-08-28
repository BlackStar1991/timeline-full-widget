import { useBlockProps, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes } ) {
    const { title, description } = attributes;

    const blockProps = useBlockProps( { tagName: 'li', className: 'timeline-item' } );

    return (
        <li { ...blockProps }>
            <RichText
                tagName="h3"
                className="tl-title"
                allowedFormats={ [] }
                value={ title }
                placeholder={ __( 'Your Title', 'za' ) }
                onChange={ ( val ) => setAttributes( { title: val } ) }
            />
            <RichText
                tagName="div"
                className="tl-desc"
                allowedFormats={ [] }
                value={ description }
                placeholder={ __( 'Your Description', 'za' ) }
                onChange={ ( val ) => setAttributes( { description: val } ) }
            />
        </li>
    );
}
