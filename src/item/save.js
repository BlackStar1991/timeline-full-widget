import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
    const { title, description } = attributes;

    return (
        <li { ...useBlockProps.save( { className: 'timeline-item' } ) }>
            <RichText.Content tagName="h3" className="tl-title" value={ title } />
            <RichText.Content tagName="div" className="tl-desc" value={ description } />
        </li>
    );
}
