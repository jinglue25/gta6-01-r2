import * as THREE from 'three';
// Signal only after the composed scene and its HUD have actually rendered.
export function shotRendered(){window.__shotReady=true;}
export function setupShots(){
 window.__shotReady=false;
 const p=new URLSearchParams(location.search),name=p.get('shot');let seed=(Number(p.get('seed'))||42)>>>0;
 if(name)Math.random=()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
 if(!['start','play','drive','end','chase','mission'].includes(name))return null;
 document.querySelector('#menu').hidden=name!=='start';
 document.querySelector('#hud').hidden=name==='start';
 return name;
}
export function composeShot(name,{player,traffic,camera,police,missions,peds}){if(name==='play'){player.mesh.position.set(8,0,100);player.mesh.rotation.y=-Math.PI/2;camera.position.set(25,13,123);camera.lookAt(-10,4,91);}else if(name==='drive'||name==='chase'){const c=traffic.parked[2];c.mesh.position.set(22,0,104);c.mesh.rotation.y=-Math.PI/2;player.enter(c,traffic);camera.position.set(41,10,119);camera.lookAt(5,2,98);if(name==='chase'){missions.reset(4);missions.noticeTime=0;police.wanted=3;police.spawnClock=99;police.spawn(34,100).mesh.rotation.y=-Math.PI/2;police.spawn(44,105).mesh.rotation.y=-Math.PI/2;camera.position.set(53,12,111);camera.lookAt(9,1.5,101);}}else if(name==='mission'){missions.reset(0);missions.noticeTime=0;player.mesh.position.set(90,0,142);player.mesh.rotation.y=-.8;camera.position.set(108,9,160);camera.lookAt(84,3,128);}else{camera.position.set(162,95,195);camera.lookAt(-10,1,27);if(name==='end'){missions.reset(5);missions.banner('Dario: You made it. This coast is yours. FREE ROAM UNLOCKED.',60);}}peds.reset(player.position);return camera.position.clone();}
