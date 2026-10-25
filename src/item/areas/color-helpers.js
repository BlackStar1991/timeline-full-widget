/** Persist stable palette colors for Timeline nested text blocks. */
export function persistTimelinePaletteColors( blocks = [], editorColors = [], updateBlockAttributes ) {
    if ( !Array.isArray( editorColors ) || !editorColors.length ) return;
    const colorsBySlug = new Map( editorColors
        .filter( ( item ) => item?.slug && /^#[0-9a-f]{3,8}$/i.test( item.color || '' ) )
        .map( ( item ) => [ item.slug, item.color ] ) );
    const visit = ( items ) => {
        items.forEach( ( block ) => {
            const { textColor, style = {} } = block.attributes || {};
            const resolved = colorsBySlug.get( textColor );
            if ( [ 'core/heading', 'core/paragraph', 'core/list' ].includes( block.name ) &&
                resolved && ! style?.color?.text ) {
                updateBlockAttributes( block.clientId, {
                    textColor: undefined,
                    style: { ...style, color: { ...style.color, text: resolved } },
                } );
            }
            if ( block.innerBlocks?.length ) visit( block.innerBlocks );
        } );
    };
    visit( blocks );
}
