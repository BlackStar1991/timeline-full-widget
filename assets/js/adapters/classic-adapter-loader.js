/** Bootstrap the Classic Editor adapter from the known plugin script URL. */
( () => {
    'use strict';
    const script = document.currentScript;
    if ( ! script?.src ) {
        console.error( '[Timeline Full Widget] Classic Editor script URL is missing.' );
        return;
    }
    const url = new URL( 'classic-adapters.js', script.src );
    url.search = new URL( script.src ).search;
    import( url.href ).catch( ( error ) => {
        console.error( '[Timeline Full Widget] Classic Editor module failed.', error );
    } );
} )();
