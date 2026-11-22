import * as THREE from 'three';
import {box,buildingBoxes} from './city.js';
import {makeCarMesh,blocked} from './vehicles.js';
export function visible(a,b){const ray=new THREE.Ray(a.clone().add(new THREE.Vector3(0,1.8,0)),b.clone().sub(a).normalize());const point=new THREE.Vector3();return !buildingBoxes.some(box=>ray.intersectBox(box,point)&&point.distanceTo(ray.origin)<a.distanceTo(b));}
export class Police {
 constructor(scene,onBusted){this.scene=scene;this.onBusted=onBusted;this.units=[];this.wanted=0;this.floor=0;this.hidden=0;this.arrest=0;this.spawnClock=0;}
 crime(amount=1){this.wanted=Math.min(5,Math.max(this.floor,this.wanted+amount));this.hidden=0;}
 setFloor(n){this.floor=n;this.wanted=Math.max(n,this.wanted);}
 clear(){this.wanted=0;this.floor=0;this.hidden=0;this.arrest=0;for(const u of this.units)this.scene.remove(u.mesh);this.units=[];}
 nearest(pos){return this.units.reduce((d,u)=>Math.min(d,u.mesh.position.distanceTo(pos)),Infinity);}
 spawn(x,z){const mesh=makeCarMesh('#ecede4');box(2.32,.55,2.6,'#202f39',0,1.1,0,mesh);box(1.7,.18,.55,'#1c2933',0,2.55,-.2,mesh);const lights=['#ff3048','#368cff'].map((c,i)=>box(.7,.25,.5,c,i? .45:-.45,2.75,-.2,mesh,new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:3})));const officer=new THREE.Group();box(.65,.9,.4,'#263d58',0,1.25,0,officer);box(.45,.45,.45,'#be916c',0,1.95,0,officer);box(.55,.14,.5,'#203348',0,2.22,0,officer);officer.position.set(2.5,0,0);mesh.add(officer);mesh.position.set(x,0,z);this.scene.add(mesh);const u={mesh,lights,officer,disabled:0,contact:0};this.units.push(u);return u;}
 chase(u,target,dt,driving){
  const p=u.mesh.position,nearest=(v,roads)=>roads.reduce((a,b)=>Math.abs(v-a)<Math.abs(v-b)?a:b);
  if(!u.route||!u.destination||u.destination.distanceTo(target)>20||u.route.length===0){
   const xs=[-120,-60,0,60,120],zs=[-120,-60,0,60,100],sx=nearest(p.x,xs),sz=nearest(p.z,zs),tx=nearest(target.x,xs),tz=nearest(target.z,zs);
   u.route=Math.abs(p.x-sx)<Math.abs(p.z-sz)?[new THREE.Vector3(sx,0,p.z),new THREE.Vector3(sx,0,tz),new THREE.Vector3(target.x,0,tz),target.clone()]:[new THREE.Vector3(p.x,0,sz),new THREE.Vector3(tx,0,sz),new THREE.Vector3(tx,0,target.z),target.clone()];
   u.destination=target.clone();
  }
  while(u.route.length&&p.distanceTo(u.route[0])<1)u.route.shift();
  const goal=visible(p,target)&&p.distanceTo(target)<25?target:u.route[0]||target;
  const delta=goal.clone().sub(p);delta.y=0;const step=Math.min(delta.length(),(driving?25:12)*dt);if(delta.lengthSq()<.01)return;delta.normalize();
  const next=p.clone().addScaledVector(delta,step);if(!blocked(next,2)){u.mesh.rotation.y=Math.atan2(delta.x,delta.z);p.copy(next);}
 }
 update(dt,player,t){this.spawnClock-=dt;if(this.wanted&&this.units.length<Math.min(5,this.wanted+1)&&this.spawnClock<=0){const p=player.position,near=(v,roads)=>roads.reduce((a,b)=>Math.abs(v-a)<Math.abs(v-b)?a:b),x=near(p.x,[-120,-60,0,60,120]),z=near(p.z,[-120,-60,0,60,100]);const edges=[new THREE.Vector3(-148,0,z),new THREE.Vector3(148,0,z),new THREE.Vector3(x,0,-140),new THREE.Vector3(x,0,110)].sort((a,b)=>a.distanceToSquared(p)-b.distanceToSquared(p));const edge=edges[Math.min(this.units.length,1)];this.spawn(edge.x,edge.z);this.spawnClock=4;}let seen=false,close=false;for(const u of this.units){u.lights.forEach((m,i)=>{m.material.emissiveIntensity=(Math.floor(t*7)%2===i)?5:.15;});if(u.disabled>0){u.disabled-=dt;u.officer.visible=false;continue;}u.officer.visible=this.wanted>=3;const p=u.mesh.position,d=p.distanceTo(player.position),los=visible(p,player.position);if(d<80&&los)seen=true;if(!this.wanted)continue;if(d>3)this.chase(u,player.position,dt,!!player.car);u.contact=Math.max(0,u.contact-dt);if(player.car&&d<4.5){player.car.speed*=Math.exp(-3*dt);player.health=Math.max(0,player.health-dt*1.5);if(Math.abs(player.car.speed)>8&&!u.contact){this.crime();u.contact=3;}}if(!player.car&&d<5&&los)close=true;}
 this.arrest=close?this.arrest+dt:0;if(this.arrest>=3){this.arrest=0;this.onBusted();return;}if(this.wanted){this.hidden=seen?0:this.hidden+dt;if(this.hidden>14){this.wanted=Math.max(this.floor,this.wanted-1);this.hidden=0;}}if(!this.wanted&&this.units.length){for(const u of this.units)this.scene.remove(u.mesh);this.units=[];}}
}
