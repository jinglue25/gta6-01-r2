import * as THREE from 'three';
import {box,bounds,buildingBoxes} from './city.js';
export function blocked(p,r=.65){const pier=(p.x>89+r&&p.x<99-r&&p.z<199-r)||(p.x>69.5+r&&p.x<118.5-r&&p.z>189.5+r&&p.z<196.5-r);return (p.z>154-r&&!pier)||p.x<bounds.minX+r||p.x>bounds.maxX-r||p.z<bounds.minZ+r||p.z>bounds.maxZ-r||buildingBoxes.some(b=>p.x>b.min.x-r&&p.x<b.max.x+r&&p.z>b.min.z-r&&p.z<b.max.z+r);}
export function makeCarMesh(color='#e7a15c',kind='coupe'){
 const g=new THREE.Group(),long=kind==='van'?5.6:4.8;
 box(2.3,.8,long,color,0,.85,0,g);box(2.05,.25,long-.15,color,0,1.32,0,g);box(1.85,.9,kind==='van'?3.4:2.4,'#294e5b',0,1.85,-.2,g);box(2,.15,kind==='van'?3.6:2.5,color,0,2.35,-.2,g);
 box(2.4,.2,.2,'#d2d2bc',0,.65,long/2,g);box(2.4,.2,.2,'#d2d2bc',0,.65,-long/2,g);
 for(const x of [-.8,.8]){box(.5,.28,.08,'#ffe4a2',x,1,long/2+.05,g);box(.5,.25,.08,'#d96b54',x,1,-long/2-.05,g);}
 const wheels=[];for(const x of [-1.17,1.17])for(const z of [-1.55,1.55]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.49,.49,.3,10),new THREE.MeshStandardMaterial({color:'#26343b'}));w.rotation.z=Math.PI/2;w.position.set(x,.53,z);g.add(w);wheels.push(w);box(.05,.35,.35,'#9aafab',x*1.15,.53,z,g);}
 const smoke=new THREE.Mesh(new THREE.ConeGeometry(1.4,3.5,7),new THREE.MeshBasicMaterial({color:'#727d7d',transparent:true,opacity:.55}));smoke.position.set(0,2.5,1.5);smoke.visible=false;g.add(smoke);g.userData.smoke=smoke;g.userData.wheels=wheels;return g;
}
export class Traffic{
 constructor(scene,roads){this.cars=[];this.parked=[];const colors=['#e6a56a','#518a90','#e4e2c4','#b06d65','#6c859d'];
  roads.forEach((lane,i)=>{for(let j=0;j<3;j++){const direction=j%2?1:-1,offset=direction*4;const car={mesh:makeCarMesh(colors[(i+j)%5],j===2?'van':'coupe'),lane,direction,speed:8+Math.random()*5,controlled:false};car.mesh.position.set(lane.axis==='x'?lane.min+25+j*78:lane.coordinate+offset,0,lane.axis==='z'?lane.min+25+j*68:lane.coordinate-offset);car.mesh.rotation.y=lane.axis==='x'?direction*Math.PI/2:direction===1?0:Math.PI;scene.add(car.mesh);this.cars.push(car);}});
  for(const x of [-112,-52,8,68,128]){const car={mesh:makeCarMesh(colors[this.parked.length%5]),speed:0,controlled:false};car.mesh.position.set(x,0,89);car.mesh.rotation.y=Math.PI/2;scene.add(car.mesh);this.parked.push(car);}
 }
 all(){const cars=[...this.cars,...this.parked];for(const c of cars)c.smoke=c.mesh.userData.smoke;return cars;}
 update(dt){for(const c of this.cars){if(c.controlled||c.disabled)continue;const axis=c.lane.axis;c.mesh.position[axis]+=c.speed*c.direction*dt;if(c.mesh.position[axis]>c.lane.max)c.mesh.position[axis]=c.lane.min;if(c.mesh.position[axis]<c.lane.min)c.mesh.position[axis]=c.lane.max;}}
 take(car){car.controlled=true;car.speed=0;this.cars=this.cars.filter(c=>c!==car);if(!this.parked.includes(car))this.parked.push(car);}
}
export class PlayerCar{
 constructor(car){this.car=car;this.mesh=car.mesh;this.speed=0;}
 update(dt,keys){if(this.car.disabled){this.speed=0;this.car.speed=0;return;}const throttle=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0);this.speed+=throttle*(this.speed*throttle<0?30:17)*dt;this.speed*=Math.exp(-(throttle?.25:1.15)*dt);if(keys.has('Space'))this.speed*=Math.exp(-6*dt);this.speed=THREE.MathUtils.clamp(this.speed,-12,37);const turn=(keys.has('KeyA')?1:0)-(keys.has('KeyD')?1:0);const oldYaw=this.mesh.rotation.y;this.mesh.rotation.y+=turn*this.speed*.038*dt;const old=this.mesh.position.clone();this.mesh.position.x+=Math.sin(this.mesh.rotation.y)*this.speed*dt;this.mesh.position.z+=Math.cos(this.mesh.rotation.y)*this.speed*dt;if(blocked(this.mesh.position,2.6)){this.mesh.position.copy(old);this.mesh.rotation.y=oldYaw;this.speed*=-.15;}this.car.speed=this.speed;}
}
