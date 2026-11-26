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
