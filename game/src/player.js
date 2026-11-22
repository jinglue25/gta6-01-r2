import * as THREE from 'three';
import {box} from './city.js';
import {blocked,PlayerCar} from './vehicles.js';
export class Player{
 constructor(scene){this.mesh=new THREE.Group();scene.add(this.mesh);this.mesh.position.set(8,0,104);this.cash=240;this.health=100;this.car=null;this.nearby=null;this.walk=0;
  box(.72,.85,.42,'#e3ad71',0,1.35,0,this.mesh);box(.8,.44,.46,'#377f7a',0,1.05,0,this.mesh);box(.5,.5,.48,'#a56e50',0,2.02,0,this.mesh);box(.56,.22,.52,'#303e43',0,2.3,-.04,this.mesh);box(.55,.43,.2,'#303e43',0,2.05,-.23,this.mesh);box(.45,.55,.28,'#e7bb63',.42,1.33,-.15,this.mesh);
  this.legs=[];this.arms=[];for(const x of [-.22,.22]){this.legs.push(box(.28,.85,.3,'#254b5d',x,.48,0,this.mesh));box(.31,.18,.53,'#efe2c7',x,.12,.09,this.mesh);this.arms.push(box(.23,.8,.25,'#ad7857',x*2.1,1.3,0,this.mesh));}
 }
 get position(){return this.car?this.car.mesh.position:this.mesh.position;}
 update(dt,keys,yaw,traffic){if(this.car){this.car.update(dt,keys);return;}const x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),z=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);const v=new THREE.Vector3(x,0,z);if(v.lengthSq()){v.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?10:5.5;const p=this.mesh.position;const nx=p.clone();nx.x+=v.x*speed*dt;if(!blocked(nx))p.x=nx.x;const nz=p.clone();nz.z+=v.z*speed*dt;if(!blocked(nz))p.z=nz.z;this.mesh.rotation.y=Math.atan2(v.x,v.z);this.walk+=dt*speed*1.8;}else this.walk=0;this.legs.forEach((m,i)=>m.rotation.x=Math.sin(this.walk+i*Math.PI)*.35);this.arms.forEach((m,i)=>m.rotation.x=-Math.sin(this.walk+i*Math.PI)*.45);
  this.nearby=traffic.all().filter(c=>Math.abs(c.speed)<15&&c.mesh.position.distanceTo(this.mesh.position)<5.5).sort((a,b)=>a.mesh.position.distanceTo(this.mesh.position)-b.mesh.position.distanceTo(this.mesh.position))[0]||null;
 }
 enter(car,traffic){traffic.take(car);this.car=new PlayerCar(car);this.mesh.visible=false;this.nearby=null;}
 interact(traffic){if(!this.car){if(this.nearby)this.enter(this.nearby,traffic);return;}if(Math.abs(this.car.speed)>2)return;const m=this.car.mesh;for(const side of [1,-1]){const p=m.position.clone().add(new THREE.Vector3(Math.cos(m.rotation.y)*3.4*side,0,-Math.sin(m.rotation.y)*3.4*side));if(!blocked(p)){this.mesh.position.copy(p);this.mesh.visible=true;this.car.car.speed=0;this.car=null;return;}}}
}
