/** Regression coverage for Gutenberg iframe and scrollable canvas viewport. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const source = readFileSync(resolve(root, 'assets/js/core/animation.js'), 'utf8');
const bundle = readFileSync(resolve(root, 'build/index.js'), 'utf8');
const { initTimelineAnimation } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

assert(bundle.includes('zaGeometryTimer'), 'Compiled Gutenberg editor must check geometry even without scroll events');
assert(bundle.includes('zaIsEditor'), 'Compiled watchdog must be scoped to Gutenberg canvas');
assert(bundle.includes('window.clearInterval(zaGeometryTimer)'), 'React unmount removes compiled geometry watcher');
assert(bundle.includes('},[b]);const O='), 'React effect must not restart when Timeline Item list changes');

function fakeElement(rectFn, parent=null, classNames=[]) {
  const listeners = new Map();
  const classes = new Set(classNames);
  return {
    nodeType:1, parentElement: parent, style:{}, scrollHeight:0,clientHeight:0,
    classList:{contains:k=>classes.has(k), add:k=>classes.add(k),remove:k=>classes.delete(k)},
    getBoundingClientRect:rectFn,
    addEventListener:(type,fn)=>{ if(!listeners.has(type)) listeners.set(type,new Set());listeners.get(type).add(fn); },
    removeEventListener:(type,fn)=>listeners.get(type)?.delete(fn),
    emit:type=>{for (const cb of listeners.get(type)||[]) cb();},
    listenerCount:type=>listeners.get(type)?.size||0,
    querySelector:()=>null,querySelectorAll:()=>[],
  };
}
function rect(top,height=800) { return {top,bottom:top+height,left:0,right:800,width:800,height}; }
function setup(parentScroller, editor=false) {
  const queued = new Map(); let id=0;
  const intervals = new Map(); let intervalId = 0;
  globalThis.requestAnimationFrame = cb => {queued.set(++id,cb);return id;};
  globalThis.cancelAnimationFrame = key=>queued.delete(key);
  globalThis.IntersectionObserver = class { observe(){} disconnect(){} };
  globalThis.MutationObserver = class { observe(){} disconnect(){} };
  const localRoot = parentScroller ? null : fakeElement(()=>rect(70,430));
  if(localRoot){localRoot.scrollHeight=1800;localRoot.clientHeight=430;}
  const parentRoot = parentScroller ? fakeElement(()=>rect(90,500)) : null;
  if(parentRoot){parentRoot.scrollHeight=1500;parentRoot.clientHeight=500;}
  const parentWin = {innerHeight:850,document:{},addEventListener:()=>{},removeEventListener:()=>{},getComputedStyle:e=>({overflowY:e===parentRoot?'auto':'visible'})};
  const iframeAncestor=parentScroller?fakeElement(()=>rect(0,500),parentRoot):null;
  const iframe = parentScroller ? fakeElement(()=>rect(240-amount,600),iframeAncestor):fakeElement(()=>rect(170,600));
  let amount=0;
  const win = {
    innerHeight:620,frameElement:iframe,parent:parentWin,
    getComputedStyle:e=>({overflowY:e===localRoot?'auto':'visible'}),
    setInterval:fn=>{intervals.set(++intervalId,fn);return intervalId;},
    clearInterval:key=>intervals.delete(key),
    addEventListener:()=>{}, removeEventListener:()=>{},
  };
  win.self={};win.top={}; // explicit same-origin parent iframe
  globalThis.window=win;
  globalThis.document={body:{classList:{contains:key=>editor && key==='editor-styles-wrapper'}},documentElement:{},querySelector:selector=>editor && selector==='.editor-styles-wrapper'?{}:null};
  const wrapper=fakeElement(()=>rect(parentScroller?120:530-amount,800),parentScroller?null:localRoot,['timeline-wrapper']);
  wrapper.closest=selector=>editor && selector==='.wp-block-za-timeline-full-widget'?{}:null;
  wrapper.isConnected=true;
  const line=fakeElement(()=>rect(wrapper.getBoundingClientRect().top,800*Number((line.style.transform.match(/scaleY\(([^)]+)\)/)||[])[1]||0)));
  const mark=fakeElement(()=>rect(wrapper.getBoundingClientRect().top+280,30));
  const item=fakeElement(()=>rect(wrapper.getBoundingClientRect().top,480),wrapper,['timeline-item']);
  item.querySelector=(selector)=>selector==='.tl-mark'?mark:null;
  wrapper.querySelector=selector=>selector==='.timeline-line-animation'?line:null;
  wrapper.querySelectorAll=selector=>selector==='li.timeline-item, .timeline-item'?[item]:[];
  const getProgress=()=>Number((line.style.transform.match(/scaleY\(([^)]+)\)/)||[])[1]);
  function frames(max=100){for(let i=0;i<max && queued.size;i++){const batch=[...queued.values()];queued.clear();for(const cb of batch)cb();}}
  return {wrapper,item,line,win,parentRoot,localRoot,frames,getProgress, intervalCount:()=>intervals.size, tick:()=>[...intervals.values()].forEach(fn=>fn()), move:n=>{amount=n;}, scroll(n){amount=n;(parentScroller?parentRoot:localRoot).emit('scroll');}};
}
// Internal scroll parent takes precedence over parent window geometry.
{
 const env=setup(false); const destroy=initTimelineAnimation(env.wrapper); env.frames();
 assert(env.getProgress()>=0 && env.getProgress()<0.15);
 env.scroll(540);env.frames(100);
 assert(env.getProgress()>0.2, 'Local Gutenberg scroll should advance the line');
 assert.equal(env.item.classList.contains('is-stuck'),true, 'Marker follows actual line progress');
 destroy();assert.equal(env.localRoot.listenerCount('scroll'),0, 'Clean up local scroll handlers');
}
// Gutenberg may scroll the iframe node inside an editor container.
{
 const env=setup(true);const destroy=initTimelineAnimation(env.wrapper);env.frames();
 assert(env.getProgress()>=0 && env.getProgress()<0.15);
 assert.equal(env.parentRoot.listenerCount('scroll'),1, 'Iframe parent scroll root is observed');
 env.scroll(420);env.frames(100);
 assert(env.getProgress()>0.25, 'Parent Gutenberg scroll should advance line');
 assert.equal(env.item.classList.contains('is-stuck'),true);
 destroy();assert.equal(env.parentRoot.listenerCount('scroll'),0, 'Clean up parent scroll handlers');
}
// A Gutenberg editor may change iframe or canvas geometry without dispatching
// any scroll event to a callback in this JS realm. The watchdog must recover.
{
 const env=setup(false,true); const destroy=initTimelineAnimation(env.wrapper);env.frames();
 assert.equal(env.intervalCount(),1,'Editor has exactly one geometry observer');
 const initial=env.getProgress();
 env.move(500);env.tick();env.frames(100);
 assert(env.getProgress()>initial+0.2,'Editor moves the progress when NO scroll callback fires');
 assert.equal(initTimelineAnimation(env.wrapper),destroy,'Repeated init is idempotent');
 assert.equal(env.intervalCount(),1,'Idempotent init cannot register duplicate watchers');
 destroy();assert.equal(env.intervalCount(),0,'Watchdog cleaned up on React unmount');
}
// The iframe itself can be moved by Gutenberg's outer scroller, while the
// wrapper's local iframe rectangle stays constant and no event is forwarded.
{
 const env=setup(true,true); const destroy=initTimelineAnimation(env.wrapper);env.frames();
 const initial=env.getProgress();
 env.move(420);env.tick();env.frames(100);
 assert(env.getProgress()>initial+0.2,'Parent frame movement advances line even without relayed scroll');
 destroy();assert.equal(env.intervalCount(),0);
}
console.log('PASS: local/parent scroll, no-event editor geometry watchdog, idempotent init, cleanup.');
