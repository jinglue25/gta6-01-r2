import * as THREE from 'three';
import {buildCity} from './city.js';
import {Traffic,blocked,makeCarMesh} from './vehicles.js';
import {Player} from './player.js';
import {HUD} from './hud.js';
import {load,save,resetSave} from './save.js';
import {setupShots,composeShot,shotRendered} from './shots.js';
import {Pedestrians} from './pedestrians.js';
import {Police} from './police.js';
import {Combat} from './combat.js';
import {Missions} from './missions.js';
import {AudioSystem} from './audio.js';

const shot=setupShots();window.__shotReady=false;
try{
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.querySelector('#view').append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#a7d5d2');scene.fog=new THREE.Fog('#b9d6ca',120,510);scene.add(new THREE.HemisphereLight('#d5f3ec','#b28f6b',2.5));const sun=new THREE.DirectionalLight('#ffdab0',3.4);sun.position.set(-70,120,65);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-160,right:160,top:160,bottom:-160,near:1,far:350});sun.shadow.bias=-.0007;scene.add(sun);

 const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,1200),city=buildCity(scene),traffic=new Traffic(scene,city.roadNetwork),player=new Player(scene),hud=new HUD(city),audio=new AudioSystem();
 let state='menu',yaw=.4,drag=false,last=0,elapsed=0,saveTime=0,frames=0,recovery=0;
 const keys=new Set(),menu=document.querySelector('#menu'),pause=document.querySelector('#pause'),continuation=document.querySelector('#continue');
 const police=new Police(scene,()=>respawn('busted')),peds=new Pedestrians(scene,city.roadNetwork),combat=new Combat(scene,audio),missions=new Missions(scene,traffic,police,audio,persist);
 const replay=document.createElement('button');replay.textContent='REPLAY STORY';replay.hidden=true;document.querySelector('.buttons').append(replay);
 const returnButton=document.createElement('button');returnButton.textContent='SAVE & RETURN TO MENU';document.querySelector('#pause>div').append(returnButton);
 const overlay=document.createElement('section');overlay.id='recovery';overlay.hidden=true;document.body.append(overlay);
 document.querySelector('#start').textContent='NEW GAME ↗';
 document.querySelector('footer').textContent='WASD / MOVE · SHIFT / SPRINT · E / ENTER OR EXIT · MOUSE OR F / SHOOT · RIGHT-DRAG OR ← → / CAMERA · SPACE / BRAKE · M / MUTE · ESC / PAUSE';
 document.querySelector('.menu-bottom').textContent='WASD / MOVE · SHIFT / SPRINT · E / ENTER OR EXIT CAR · MOUSE OR F / SHOOT · RIGHT-DRAG OR ← → / CAMERA · SPACE / BRAKE · M / MUTE · ESC / PAUSE';
 document.querySelector('.story').textContent='Marina Vale. Courier. New arrival. Dario Venn has a job for you: Drive to the marina pier. Collect the sealed package.';
 function refreshMenu(){const s=load();continuation.disabled=!s;replay.hidden=!(missions.index>=5||s?.mission===5);}
 function persist(){if(!shot){save(player,missions);refreshMenu();}}
 function leaveCar(){if(player.car){player.car.car.speed=0;player.car=null;}player.mesh.visible=true;}
 function begin(resume=false){
  if(!shot)audio.start();audio.play('click');leaveCar();police.clear();keys.clear();recovery=0;overlay.hidden=true;
  player.mesh.position.set(8,0,104);player.health=100;player.cash=240;
  const s=resume?load():null;if(!resume){resetSave();for(const c of traffic.all()){c.stolen=false;c.disabled=false;c.health=3;c.smoke.visible=false;if(c.lane&&!c.controlled)c.speed=10;}}missions.reset(s?.mission||0);
  if(s){const p=new THREE.Vector3(...s.position);if(!blocked(p))player.mesh.position.copy(p);player.cash=s.cash;player.health=Math.max(1,s.health);player.mesh.rotation.y=Number.isFinite(s.yaw)?s.yaw:0;missions.timer=Number.isFinite(s.timer)&&s.timer>0?s.timer:missions.timer;
   if(missions.index===2&&s.stage===1&&Array.isArray(s.missionCar)&&s.missionCar.length===3&&s.missionCar.every(Number.isFinite)){const cp=new THREE.Vector3(...s.missionCar);if(!blocked(cp,2.6)){missions.coupe.mesh.position.copy(cp);missions.stage=1;}}
   if(s.mode==='car'&&!blocked(p,2.6)){const c=missions.index===2&&s.stage===1?missions.coupe:{mesh:makeCarMesh('#e6a56a'),speed:0,controlled:true};if(!traffic.parked.includes(c)){scene.add(c.mesh);traffic.parked.push(c);}c.mesh.position.copy(p);c.mesh.rotation.y=player.mesh.rotation.y;c.health=Math.max(1,s.carHealth||3);player.enter(c,traffic);if(c===missions.coupe)missions.stage=1;}
  }
  peds.reset(player.position);state='playing';menu.hidden=true;pause.hidden=true;hud.show(true);camera.position.copy(player.position).add(new THREE.Vector3(10,7,13));missions.update(0,player,elapsed);refreshMenu();
 }
 function respawn(kind){
  if(state!=='playing')return;const busted=kind==='busted',fee=Math.min(player.cash,busted?150:250);
  const pos=busted?[-130,0,-130]:[130,0,-130];leaveCar();player.mesh.position.set(...pos);player.cash-=fee;player.health=100;police.clear();peds.reset(player.position);
  if(missions.index===2){missions.ensureCoupe();}persist();state='recovering';recovery=4;keys.clear();
  overlay.replaceChildren();const title=document.createElement('h2'),body=document.createElement('p');title.textContent=busted?'City Lockup':'Second Sunrise';body.textContent=(busted?'A quiet cell. A fresh start. Fine: $':'The coast gives you another morning. Medical fee: $')+fee;overlay.append(title,body);overlay.hidden=false;
 }
 function togglePause(){if(!['playing','paused'].includes(state))return;audio.play('click');state=state==='paused'?'playing':'paused';pause.hidden=state!=='paused';keys.clear();if(state==='paused')persist();}
 document.querySelector('#start').onclick=()=>begin();continuation.onclick=()=>begin(true);replay.onclick=()=>begin();document.querySelector('#resume').onclick=togglePause;
 returnButton.onclick=()=>{persist();audio.play('click');state='menu';pause.hidden=true;menu.hidden=false;hud.show(false);keys.clear();refreshMenu();};
 addEventListener('keydown',e=>{audio.start();if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;
  if(e.code==='KeyM'){audio.toggle();return;}if(e.code==='Escape')togglePause();
  if(e.code==='KeyE'&&state==='playing'){const taking=!player.car?player.nearby:null;player.interact(traffic);if(taking&&player.car){if(taking!==missions.coupe&&!taking.stolen&&(peds.witnesses(player.position)||police.nearest(player.position)<40))police.crime();taking.stolen=true;missions.taken(taking);}}
  keys.add(e.code);
 });
 addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();if(state==='playing'&&!shot)togglePause();});
 renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
 renderer.domElement.addEventListener('pointerdown',e=>{audio.start();drag=e.button===2;renderer.domElement.setPointerCapture(e.pointerId);combat.mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);if(e.button===0&&state==='playing'&&!shot)combat.fire(player,camera,peds,traffic,police);});
 addEventListener('pointerup',()=>drag=false);addEventListener('pointermove',e=>{combat.mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);if(drag&&!shot)yaw-=e.movementX*.005;});
 addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
 addEventListener('pagehide',()=>{if(state!=='menu')persist();});refreshMenu();
 if(shot){if(shot!=='start'){begin();menu.hidden=true;hud.show(true);}composeShot(shot,{player,traffic,camera,police,missions,peds});missions.update(0,player,1.5);police.update(0,player,1.5);}
 function frame(ms){requestAnimationFrame(frame);const dt=Math.min((ms-last)/1000,.04);last=ms;elapsed+=dt;
  if(state==='playing'&&!shot){yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.8;player.update(dt,keys,yaw,traffic);traffic.update(dt);peds.update(dt,player,police);police.update(dt,player,elapsed);
   if(state==='playing'){combat.update(dt,player,police,keys.has('KeyF'),camera,peds,traffic);if(player.health<=0)respawn('downed');else missions.update(dt,player,elapsed);}saveTime+=dt;if(saveTime>10){persist();saveTime=0;}}
  if(state==='recovering'){recovery-=dt;if(recovery<=0){state='playing';overlay.hidden=true;}}
  if(!shot){if(state==='menu'){traffic.update(dt);camera.position.set(162+Math.sin(elapsed*.06)*7,95,195);camera.lookAt(-10,1,27);}else if(state==='playing'||state==='recovering'){const p=player.position,angle=player.car?player.car.mesh.rotation.y+Math.PI+yaw-.4:yaw,offset=player.car?16:10;const target=p.clone().add(new THREE.Vector3(Math.sin(angle)*offset,player.car?7:6,Math.cos(angle)*offset));camera.position.lerp(target,1-Math.exp(-5*dt));camera.lookAt(p.x,p.y+1.8,p.z);}}
  if(state!=='paused')city.update(shot?1.5:elapsed);audio.update(player,police,elapsed,state==='playing');hud.update(player,traffic,police,missions);renderer.render(scene,camera);if(shot&&++frames===3)shotRendered();
 }
 requestAnimationFrame(frame);
}catch(error){document.querySelector('#error').hidden=false;document.querySelector('#error').textContent='Port Solana could not start. A desktop browser with WebGL 2 is required. '+error.message;console.error(error);}
