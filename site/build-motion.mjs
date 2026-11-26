import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
for (const [folder,engine,global,fn] of [
 ['ascii-sharks','AsciiSharksEngine','AsciiSharks','mountAsciiSharks'],
 ['blue-glass','BlueFlutedGlassEngine','BlueFlutedGlass','mountBlueFlutedGlass']
]) {
 const base='site/components/'+folder+'/';
 let runtime=stripTypeScriptTypes(await readFile(base+'motion-runtime.ts','utf8')).replaceAll('export ','');
 let source=(await readFile(base+engine+'.js','utf8')).replace(/import \{ createSurface \} from "\.\/motion-runtime";/,'').replace(/export \{[\s\S]*?\};/g,'').replaceAll('export function','function');
 if(folder==='blue-glass') source=source.replace('"responsive":false','"responsive":true');
 await mkdir('site/public/components/'+folder,{recursive:true});
 await writeFile('site/public/components/'+folder+'/bundle.js','/* LeiBox component source notices retained below. */\nvar '+global+'=(()=>{\n'+runtime+'\n'+source+'\nreturn {mount:'+fn+'};})();');
}

// LeiBox's standalone Deep Agent renderer contains both native mount variants.
// Keep its bundled runtime and notices intact, and expose the two mount entries.
const originalDeepAgent = await readFile('site/components/deep-agent/original-standalone.html', 'utf8');
let deepAgent = originalDeepAgent.slice(originalDeepAgent.indexOf('<script>') + '<script>'.length);
deepAgent = deepAgent.slice(0, deepAgent.lastIndexOf('</script>'));
const sliderEntry = 'function fhe(e,t={}){return e6e(e,t,"slider",';
if (!deepAgent.includes(sliderEntry)) throw new Error('Deep Agent upstream entry changed');
deepAgent = deepAgent.replace(sliderEntry, 'function fhe(e,t={},variant="slider"){return e6e(e,t,variant,');
deepAgent = deepAgent.replace(
  'fhe(document.getElementById("deep-agent-demo"));',
  'window.DeepAgentUI={mountComposer:(target,options)=>fhe(target,options,"composer"),mountSlider:(target,options)=>fhe(target,options,"slider")};',
);
await mkdir('site/public/components/deep-agent', {recursive:true});
await writeFile('site/public/components/deep-agent/bundle.js', deepAgent);
