/**
 * Shared import-confirmation dialog for Gutenberg and Elementor.
 *
 * This reuses the original Elementor dialog approach (a local DOM overlay),
 * without requiring the Elementor SDK inside Gutenberg or a duplicate React
 * implementation. Transfer files are validated by the caller before opening.
 * No HTML from a transfer is interpolated into the dialog's DOM.
 *
 * @package TimelineFullWidget
 */
import { IMPORT_OPTIONS } from './transfer-core.js';

const OPTION_LABELS = {
    content: 'Headings, text and Timeline item content',
    margin: 'External margins',
    padding: 'Internal padding',
    gap: 'Gaps and spacing',
    identifiers: 'HTML IDs and anchors (may conflict on this page)',
    classes: 'Custom CSS classes',
    customStyles: 'Custom style rules',
    animation: 'Animations and motion effects',
    links: 'Links and destinations',
    responsive: 'Responsive tablet/mobile overrides',
    typography: 'Typography and fonts',
    background: 'Backgrounds, borders and shadows',
};

/**
 * @param {Object} params
 * @param {Object} params.transfer Already validated transfer envelope.
 * @param {string} params.filename Original local filename, displayed as text.
 * @param {'elementor'|'gutenberg'} params.destination Destination editor.
 * @param {Function} params.onAccept Called only after explicit confirmation.
 * @param {Function} [params.translate] gettext-style translator.
 */
export function openImportDialog( { transfer, filename, destination, onAccept, translate = ( text ) => text } ) {
    if ( !transfer || ! [ 'elementor', 'gutenberg' ].includes( destination ) || typeof onAccept !== 'function' ) {
        throw new Error( 'Invalid Timeline import dialog arguments.' );
    }

    // Only one import dialog may be active per editor document.
    document.querySelector?.( '.tfw-transfer-overlay' )?.remove();

    const overlay = document.createElement( 'div' );
    overlay.className = 'tfw-transfer-overlay';
    overlay.setAttribute( 'role', 'dialog' );
    overlay.setAttribute( 'aria-modal', 'true' );
    overlay.setAttribute( 'aria-label', translate( 'Timeline import options' ) );
    overlay.style.cssText = 'position:fixed;inset:0;background:#0009;z-index:999999;display:grid;place-items:center;padding:20px';

    const box = document.createElement( 'div' );
    box.style.cssText = 'background:#fff;color:#222;box-sizing:border-box;max-width:540px;width:100%;max-height:85vh;overflow:auto;padding:22px;border-radius:7px;font:14px Arial,sans-serif';
    const heading = document.createElement( 'h3' );
    heading.textContent = translate( 'Import Timeline' );
    heading.style.cssText = 'font-size:18px;line-height:1.4;margin:0 0 12px';
    box.append( heading );

    const details = document.createElement( 'p' );
    const count = transfer.origin === 'elementor' ? transfer.data?.list?.length : transfer.data?.innerBlocks?.length;
    details.textContent = `${ translate( 'File' ) }: ${ filename }. ${ translate( 'Source' ) }: ${ transfer.origin }. ${ count ?? 0 } ${ translate( 'Timeline items' ) }. ${ translate( 'Choose the properties to import. Original media becomes local placeholders. You can undo this change in the editor.' ) }`;
    details.style.cssText = 'overflow-wrap:anywhere;line-height:1.5';
    box.append( details );

    const showWarning = ( message ) => {
        const warning = document.createElement( 'p' );
        warning.style.cssText = 'padding:10px;background:#fff3cd;border-left:3px solid #ad6500;line-height:1.5';
        warning.textContent = message;
        box.append( warning );
    };
    if ( transfer.origin !== destination ) {
        showWarning( translate( 'Cross-editor import converts supported Timeline properties. Editor-specific CSS, fonts and complex blocks may need manual adjustments.' ) );
    }
    if ( transfer.warnings?.length ) {
        showWarning( transfer.warnings.join( ' ' ) );
    }

    const inputs = {};
    for ( const [ key, caption ] of Object.entries( OPTION_LABELS ) ) {
        const label = document.createElement( 'label' );
        label.style.cssText = 'display:flex;gap:8px;align-items:flex-start;padding:5px 0;line-height:1.35;cursor:pointer';
        const checkbox = document.createElement( 'input' );
        checkbox.type = 'checkbox';
        checkbox.checked = key === 'content' && transfer.warnings?.length ? false : IMPORT_OPTIONS[ key ];
        checkbox.style.cssText = 'flex:0 0 auto;margin:2px 0 0';
        inputs[ key ] = checkbox;
        label.append( checkbox, document.createTextNode( ' ' + translate( caption ) ) );
        box.append( label );
    }

    const explanation = document.createElement( 'p' );
    explanation.style.cssText = 'margin:14px 0 0;font-size:12px;color:#50575e;line-height:1.5';
    const updateExplanation = () => {
        explanation.textContent = inputs.content.checked
            ? translate( 'The destination Timeline will be replaced, including its titles, text and nested content. You can undo this action.' )
            : translate( 'Imported styles and layout will replace the destination Timeline, while text in matching blocks is kept. You can undo this action.' );
    };
    inputs.content.addEventListener( 'change', updateExplanation );
    updateExplanation();
    box.append( explanation );

    const error = document.createElement( 'p' );
    error.setAttribute( 'role', 'alert' );
    error.style.cssText = 'display:none;color:#b32d2e;margin:12px 0 0';
    box.append( error );

    const actions = document.createElement( 'div' );
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:18px';
    const cancel = document.createElement( 'button' );
    cancel.type = 'button';
    cancel.textContent = translate( 'Cancel' );
    cancel.style.cssText = 'background:#f0f0f1;color:#1d2327;border:1px solid #8c8f94;padding:9px 12px;border-radius:4px;cursor:pointer';
    const confirm = document.createElement( 'button' );
    confirm.type = 'button';
    confirm.textContent = translate( 'Apply selected properties' );
    confirm.style.cssText = 'background:#2271b1;color:white;border:0;padding:10px 12px;border-radius:4px;cursor:pointer';
    actions.append( cancel, confirm );
    box.append( actions );
    overlay.append( box );

    const previousFocus = document.activeElement;
    const close = () => {
        overlay.remove();
        previousFocus?.focus?.();
    };
    cancel.addEventListener( 'click', close );
    overlay.addEventListener( 'click', ( event ) => { if ( event.target === overlay ) close(); } );
    overlay.addEventListener( 'keydown', ( event ) => {
        if ( event.key === 'Escape' ) { event.preventDefault?.(); close(); }
        if ( event.key === 'Tab' ) {
            // Keep keyboard navigation inside the modal. Native inputs/buttons
            // remain keyboard accessible rather than being replaced by divs.
            const focusables = [ ...Object.values( inputs ), cancel, confirm ];
            const first = focusables[ 0 ];
            const last = focusables[ focusables.length - 1 ];
            if ( event.shiftKey && document.activeElement === first ) {
                event.preventDefault?.(); last.focus();
            } else if ( !event.shiftKey && document.activeElement === last ) {
                event.preventDefault?.(); first.focus();
            }
        }
    } );
    confirm.addEventListener( 'click', () => {
        const selected = Object.fromEntries( Object.entries( inputs ).map( ( [ key, checkbox ] ) => [ key, checkbox.checked ] ) );
        try {
            onAccept( selected );
            close();
        } catch ( caught ) {
            error.textContent = caught instanceof Error ? caught.message : translate( 'Timeline import failed.' );
            error.style.display = 'block';
        }
    } );

    document.body.append( overlay );
    confirm.focus();
    return { close };
}
