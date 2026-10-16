/**
 * Gutenberg inspector bootstrap safe for WordPress classic script tags.
 * Do not add static import declarations: WordPress may override module metadata.
 * @package TimelineFullWidget
 */
( () => {
    'use strict';

    const script = document.currentScript;
    if ( !script?.src ) {
        console.error( '[Timeline Full Widget] Gutenberg transfer loader has no script URL.' );
        return;
    }

    const moduleUrl = new URL( 'gutenberg-editor.js', script.src );
    moduleUrl.search = new URL( script.src ).search;
    import( moduleUrl.href ).catch( ( error ) => {
        console.error( '[Timeline Full Widget] Could not initialize Gutenberg import/export.', error );
    } );
} )();
