import express from 'express';
const app=express(); app.use(express.json()); app.use(express.static('public'));
const port=process.env.PORT||10000;
let cached=null, cachedAt=0;
async function openMeteo(){
 const u=new URL('https://api.open-meteo.com/v1/forecast');
 u.search=new URLSearchParams({latitude:'33.8938',longitude:'35.5018',hourly:'temperature_2m,relative_humidity_2m',forecast_days:'3',timezone:'Asia/Beirut'});
 const r=await fetch(u); if(!r.ok) throw Error('Open-Meteo HTTP '+r.status);
 const d=await r.json();
 return {location:'Beirut, Lebanon',sources:['Open-Meteo'],hours:d.hourly.time.map((time,i)=>({time,temperature:d.hourly.temperature_2m[i],humidity:d.hourly.relative_humidity_2m[i]})),updatedAt:new Date().toISOString()};
}
async function metNo(){
 const u='https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=33.8938&lon=35.5018';
 const r=await fetch(u,{headers:{'User-Agent':'BeirutWeather/1.0 contact: weather-site'}});
 if(!r.ok) throw Error('MET Norway HTTP '+r.status);
 const d=await r.json(), cutoff=Date.now()+72*3600000;
 const hours=d.properties.timeseries.filter(x=>Date.parse(x.time)<=cutoff).map(x=>({time:x.time,temperature:x.data.instant.details.air_temperature,humidity:x.data.instant.details.relative_humidity}));
 return {location:'Beirut, Lebanon',sources:['MET Norway'],hours,updatedAt:new Date().toISOString()};
}
app.get('/api/weather',async(_req,res)=>{
 if(cached && Date.now()-cachedAt<10*60*1000) return res.json(cached);
 try{cached=await openMeteo();cachedAt=Date.now();return res.json(cached)}
 catch(primary){console.error('Open-Meteo forecast error:',primary.message);
  try{cached=await metNo();cachedAt=Date.now();return res.json(cached)}
  catch(backup){console.error('Backup forecast error:',backup.message);
   if(cached)return res.json({...cached,stale:true});
   res.status(502).json({error:'Forecast providers are temporarily unavailable'});}
 }
});
app.get('/api/sensor',(_req,res)=>res.json({latest:null,history:[],bridge:'not connected'}));
app.get('*',(_req,res)=>res.sendFile(process.cwd()+'/public/index.html'));
app.listen(port,'0.0.0.0',()=>console.log('Beirut Weather listening on '+port));