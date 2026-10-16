/**
 * Classic-script bootstrap for Elementor Elementor import/export.
 *
 * Elementor may load registered widget dependencies using script tags that do
 * not respect WordPress ES-module metadata. Dynamic import() also works inside
 * ordinary scripts and guarantees module parsing for the actual entrypoint.
 * Never add a top-level static `import` declaration to this loader.
 */
( () => {
    'use strict';

    const script = document.currentScript;
    if ( !script || !script.src ) {
        console.error( '[Timeline Full Widget] Elementor import/export loader has no script URL.' );
        return;
    }

    const moduleUrl = new URL( 'elementor-editor.js', script.src );
    // Keep WP's version token so replacing a plugin invalidates the entrypoint.
    moduleUrl.search = new URL( script.src ).search;
    import( moduleUrl.href ).catch( ( error ) => {
        console.error( '[Timeline Full Widget] Could not initialize Elementor import/export.', error );
    } );
} )();
