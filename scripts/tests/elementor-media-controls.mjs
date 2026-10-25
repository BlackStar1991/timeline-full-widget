/** Exercise the actual editor-only media control script with a minimal jQuery DOM model. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const listeners = {};
const controls = {
    image: { visible: true }, alt: { visible: true },
    video: { visible: false }, poster: { visible: false },
};
const select = { value: 'image' };
const row = {kind: 'row'};
let toggled = 0;
function wrap(node) {
    return {
        length: node ? 1 : 0,
        first() {return this;},
        val() {return node?.value;},
        closest() {return wrap(row);},
        find(selector) {
            if(selector === '.elementor-control-media_type select') return wrap(select);
            const targets = [];
            if(selector.includes('.elementor-control-media_image_alt')) targets.push(controls.alt);
            if(selector.includes('.elementor-control-media_image,')) targets.push(controls.image);
            if(selector.includes('.elementor-control-media_video')) targets.push(controls.video);
            if(selector.includes('.elementor-control-posterURL')) targets.push(controls.poster);
            return {
                toggle(visible) { for (const field of targets) { field.visible=visible; toggled++; } },
            };
        },
        each(handler) {if (node?.kind === 'row') handler.call(node);},
    };
}
const document = {};
const window = {};
function $(node) {
    if (typeof node === 'function') { node(); return wrap(null); }
    if (node === document || node === window) return {
        on(event,selector,handler) { listeners[event + ':' + (typeof selector === 'string' ? selector : '')]=handler || selector; },
    };
    if (typeof node === 'string') return wrap(node === '.elementor-repeater-row-controls:visible' ? row : null);
    return wrap(node);
}
new Function('jQuery','document','window',readFileSync(new URL('../../assets/elementor/elementor-media-preview.js',import.meta.url),'utf8'))($,document,window);
const change = listeners['change:.elementor-control-media_type select'];
assert.equal(typeof change,'function','change handler registered');
change.call(select);
assert.equal(controls.image.visible,true);
assert.equal(controls.video.visible,false);
select.value='video';
change.call(select);
assert.equal(controls.image.visible,false);
assert.equal(controls.alt.visible,false);
assert.equal(controls.video.visible,true);
assert.equal(controls.poster.visible,true);
select.value='image';
change.call(select);
assert.equal(controls.image.visible,true);
assert.equal(controls.alt.visible,true);
assert.equal(controls.video.visible,false);
assert.equal(controls.poster.visible,false);
assert.ok(toggled>=12);
console.log('PASS: imported Elementor repeater switches image and video inputs in both directions');
console.log('PASS: media selection is delegated to native Elementor controls');
