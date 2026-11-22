export class AudioSystem {
 constructor(){this.muted=false;this.ctx=null;}
 start(){if(this.ctx){this.ctx.resume();return;}const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=.24;this.master.connect(this.ctx.destination);this.engine=this.voice('sawtooth',45,.0);this.siren=this.voice('sine',600,0);this.pad=this.voice('sine',110,.035);this.voice('sine',164.81,.018);}
 voice(type,freq,volume){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=volume;o.connect(g).connect(this.master);o.start();return {o,g};}
 tone(freq,duration=.12,type='sine',volume=.2,delay=0){if(!this.ctx)return;const t=this.ctx.currentTime+delay,v=this.voice(type,freq,0);v.g.gain.setValueAtTime(volume,t);v.g.gain.exponentialRampToValueAtTime(.001,t+duration);v.o.stop(t+duration+.02);}
 play(name){if(name==='shot'){this.tone(95,.12,'sawtooth',.6);this.tone(730,.045,'square',.2);}else if(name==='complete'){[330,440,554,660].forEach((f,i)=>this.tone(f,.35,'sine',.2,i*.13));}else if(name==='cash'){this.tone(880);this.tone(1320,.2,'sine',.2,.1);}else this.tone(440,.06);}
 toggle(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.24;return this.muted;}
 update(player,police,t,active){if(!this.ctx)return;const now=this.ctx.currentTime;this.engine.o.frequency.setTargetAtTime(38+Math.abs(player.car?.speed||0)*4,now,.1);this.engine.g.gain.setTargetAtTime((active&&player.car&&!player.car.car.disabled)? .045:0,now,.15);const distance=police.nearest(player.position);this.siren.o.frequency.setTargetAtTime(Math.floor(t*2)%2?660:880,now,.04);this.siren.g.gain.setTargetAtTime(active?Math.max(0,1-distance/110)*.12:0,now,.2);}
}
