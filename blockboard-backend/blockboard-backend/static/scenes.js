// Drawn placeholder photos for the demo (no image files needed).
function rng(s){return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const IMG={};
function scene(type,fixed,seed){
  const key=type+fixed+(seed||1);if(IMG[key])return IMG[key];
  const c=document.createElement('canvas');c.width=c.height=600;const x=c.getContext('2d');const r=rng(seed||7);
  const asphalt=(top)=>{x.fillStyle='#55595c';x.fillRect(0,top,600,600-top);for(let i=0;i<2500;i++){x.fillStyle=`rgba(${r()<.5?255:0},${r()<.5?255:0},${r()<.5?255:0},.06)`;x.fillRect(r()*600,top+r()*(600-top),2,2)}};
  const sky=(a,b)=>{const g=x.createLinearGradient(0,0,0,300);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,600,600)};
  const sidewalk=(y,h)=>{x.fillStyle='#b9b6ad';x.fillRect(0,y,600,h);x.strokeStyle='#a19e95';x.lineWidth=3;for(let i=0;i<600;i+=120){x.beginPath();x.moveTo(i,y);x.lineTo(i-40,y+h);x.stroke()}};
  if(type==='pothole'){
    sky('#9cc3e0','#dfe9ef');x.fillStyle='#6d8b5a';x.fillRect(0,170,600,40);asphalt(200);
    x.fillStyle='#f2c230';for(let i=0;i<4;i++){x.beginPath();x.moveTo(290-i*6,230+i*100);x.lineTo(310+i*6,230+i*100);x.lineTo(316+i*8,290+i*100);x.lineTo(284-i*8,290+i*100);x.fill()}
    if(!fixed){x.fillStyle='#2b2d2e';x.beginPath();for(let a=0;a<6.3;a+=.3){const rr=120+r()*30;x.lineTo(300+Math.cos(a)*rr*1.3,430+Math.sin(a)*rr*.55)}x.fill();x.fillStyle='#4a6a7a';x.beginPath();x.ellipse(300,445,90,30,0,0,7);x.fill();x.fillStyle='rgba(255,255,255,.25)';x.beginPath();x.ellipse(270,440,30,7,0,0,7);x.fill()}
    else{x.fillStyle='#3e4245';x.fillRect(130,360,340,150);x.strokeStyle='#2f3234';x.lineWidth=4;x.strokeRect(130,360,340,150)}
  } else if(type==='light'){
    sky(fixed?'#1b2340':'#0d1120','#2a3150');for(let i=0;i<40;i++){x.fillStyle='rgba(255,255,255,.7)';x.fillRect(r()*600,r()*260,2,2)}
    asphalt(430);sidewalk(400,40);x.fillStyle='#22262b';x.fillRect(150,150,18,260);x.fillRect(150,150,140,14);x.fillStyle='#30353b';x.beginPath();x.moveTo(260,164);x.lineTo(320,164);x.lineTo(305,184);x.lineTo(275,184);x.fill();
    if(fixed){const g=x.createRadialGradient(290,190,5,290,420,260);g.addColorStop(0,'rgba(255,214,120,.95)');g.addColorStop(1,'rgba(255,214,120,0)');x.fillStyle=g;x.beginPath();x.moveTo(275,184);x.lineTo(305,184);x.lineTo(470,520);x.lineTo(110,520);x.fill();x.fillStyle='#ffe6a6';x.fillRect(276,182,28,5)}
    else{x.fillStyle='#14171a';x.fillRect(276,182,28,5)}
    x.fillStyle='#3b3f45';x.fillRect(420,300,140,110);x.fillStyle=fixed?'#e8c46a':'#2a2e33';x.fillRect(440,320,30,30);x.fillRect(500,320,30,30);
  } else if(type==='flood'){
    sky('#8b98a3','#c3c9cd');x.fillStyle='#8a8f8a';x.fillRect(0,150,600,80);sidewalk(150,90);x.fillStyle='#d8d4ca';x.fillRect(0,240,600,22);asphalt(262);
    x.fillStyle='#1f2224';x.fillRect(250,268,120,46);x.strokeStyle='#555';x.lineWidth=4;for(let i=0;i<7;i++){x.beginPath();x.moveTo(262+i*16,270);x.lineTo(262+i*16,312);x.stroke()}
    if(!fixed){x.fillStyle='rgba(90,130,160,.72)';x.beginPath();x.ellipse(310,380,280,110,0,0,7);x.fill();for(let i=0;i<14;i++){x.fillStyle=['#a5672a','#c48a2b','#7a5a2a'][i%3];x.save();x.translate(150+r()*320,300+r()*140);x.rotate(r()*6);x.beginPath();x.ellipse(0,0,16,7,0,0,7);x.fill();x.restore()}x.fillStyle='rgba(255,255,255,.3)';for(let i=0;i<8;i++){x.beginPath();x.ellipse(120+r()*380,330+r()*110,40,4,0,0,7);x.fill()}}
  } else if(type==='trash'){
    x.fillStyle='#9a5a43';x.fillRect(0,0,600,360);x.strokeStyle='#7b4433';x.lineWidth=3;for(let y=0;y<360;y+=30){x.beginPath();x.moveTo(0,y);x.lineTo(600,y);x.stroke();for(let i=(y/30)%2*40;i<600;i+=80){x.beginPath();x.moveTo(i,y);x.lineTo(i,y+30);x.stroke()}}
    sidewalk(360,160);asphalt(520);
    if(!fixed){x.fillStyle='#6b4a3a';x.fillRect(110,300,300,120);x.fillStyle='#7d5845';x.fillRect(90,270,60,150);x.fillRect(370,270,60,150);x.fillRect(120,240,280,80);x.fillStyle='#1d1f21';[[460,400],[520,410],[490,360]].forEach(p=>{x.beginPath();x.ellipse(p[0],p[1],38,44,0,0,7);x.fill()})}
  } else if(type==='graffiti'){
    x.fillStyle='#b8a99a';x.fillRect(0,0,600,600);x.strokeStyle='#a09080';x.lineWidth=3;for(let y=0;y<520;y+=34){x.beginPath();x.moveTo(0,y);x.lineTo(600,y);x.stroke()}
    sidewalk(520,80);
    if(!fixed){x.lineCap='round';x.lineWidth=18;['#d6336c','#2d62b8','#f2c230','#111'].forEach((col,k)=>{x.strokeStyle=col;x.beginPath();x.moveTo(80+k*20,200+k*50);for(let i=0;i<8;i++)x.quadraticCurveTo(120+i*60+r()*30,120+k*50+r()*160,150+i*60,220+k*50+r()*40);x.stroke()})}
    else{x.fillStyle='#c4b6a8';x.fillRect(60,100,480,330)}
  } else if(type==='tree'){
    sky('#a9cde6','#e5eef2');x.fillStyle='#5f8c4a';x.beginPath();x.arc(120,200,120,0,7);x.fill();x.fillStyle='#4f3a2a';x.fillRect(100,240,40,170);sidewalk(400,120);asphalt(520);
    if(!fixed){x.strokeStyle='#5b4330';x.lineWidth=26;x.lineCap='round';x.beginPath();x.moveTo(140,450);x.lineTo(540,470);x.stroke();x.fillStyle='#5f8c4a';for(let i=0;i<9;i++){x.beginPath();x.arc(200+i*42,440+r()*30,30+r()*16,0,7);x.fill()}}
  } else if(type==='blockage'){
    sky('#9fb7c9','#dbe4ea');x.fillStyle='#7d8a7a';x.fillRect(0,200,600,40);asphalt(240);
    x.fillStyle='#e9e4d6';x.fillRect(330,250,230,150);x.fillStyle='#c9c3b4';x.fillRect(470,280,90,120);x.fillStyle='#2a2d30';[[370,405],[520,405]].forEach(p=>{x.beginPath();x.arc(p[0],p[1],24,0,7);x.fill()});
    if(!fixed){for(let k=0;k<2;k++){const bx=40+k*170,by=430;x.fillStyle='#fff';x.fillRect(bx,by,150,36);x.save();x.beginPath();x.rect(bx,by,150,36);x.clip();x.fillStyle='#e8661c';for(let s=-40;s<190;s+=36){x.beginPath();x.moveTo(bx+s,by+36);x.lineTo(bx+s+18,by+36);x.lineTo(bx+s+36,by);x.lineTo(bx+s+18,by);x.fill()}x.restore();x.fillStyle='#555';x.fillRect(bx+12,by+36,8,50);x.fillRect(bx+130,by+36,8,50)}
      [[90,560],[300,560],[480,560]].forEach(p=>{x.fillStyle='#ef6c1a';x.beginPath();x.moveTo(p[0],p[1]-70);x.lineTo(p[0]+28,p[1]);x.lineTo(p[0]-28,p[1]);x.fill();x.fillStyle='#fff';x.fillRect(p[0]-14,p[1]-40,28,10)})}
  } else if(type==='hazard'){
    sky('#a9c4d6','#e2eaee');sidewalk(200,60);asphalt(260);x.fillStyle='#2f8f5a';x.fillRect(0,330,600,26);
    if(!fixed){for(let i=0;i<70;i++){x.save();x.translate(60+r()*480,280+r()*300);x.rotate(r()*6);x.fillStyle=i%3?'rgba(200,235,240,.85)':'#9aa3a8';x.beginPath();x.moveTo(0,0);x.lineTo(10+r()*14,3);x.lineTo(4,9+r()*8);x.fill();x.restore()}
      x.fillStyle='#f2c230';x.beginPath();x.moveTo(470,60);x.lineTo(560,210);x.lineTo(380,210);x.closePath();x.fill();x.strokeStyle='#1d1f21';x.lineWidth=8;x.stroke();x.fillStyle='#1d1f21';x.font='bold 90px sans-serif';x.textAlign='center';x.fillText('!',470,195)}
  } else if(type==='signal'){
    sky('#9fb7c9','#dbe4ea');asphalt(380);x.fillStyle='#333';x.fillRect(290,120,16,270);x.fillStyle='#1d1f21';x.fillRect(250,60,96,210);
    ['#c2392f','#f2c230','#1f8a5b'].forEach((col,i)=>{x.fillStyle=fixed?(i===2?'#34d27a':'#2a2c2e'):(i===0?'#ff4a3a':'#2a2c2e');x.beginPath();x.arc(298,100+i*66,24,0,7);x.fill()});
    if(!fixed){x.fillStyle='#fff';x.font='bold 28px sans-serif';x.fillText('STUCK',380,120)}
  }
  if(!['pothole','light','flood','trash','graffiti','tree','signal','blockage','hazard'].includes(type)){return scene('pothole',fixed,seed)}
  return IMG[key]=c.toDataURL('image/jpeg',.82);
}

