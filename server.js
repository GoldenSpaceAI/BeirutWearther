import express from 'express';
const app=express(); app.use(express.json()); app.use(express.static('public'));
const port=process.env.PORT||10000;
app.get('/api/weather',async(_req,res)=>{
 try{
  const u=new URL('https://api.open-meteo.com/v1/forecast');
  u.search=new URLSearchParams({latitude:'33.8938',longitude:'35.5018',hourly:'temperature_2m,relative_humidity_2m',forecast_days:'3',timezone:'Asia/Beirut'});
  const response=await fetch(u);
  if(!response.ok) throw new Error('Weather provider returned '+response.status);
  const data=await response.json();
  const hours=data.hourly.time.map((time,i)=>({time,temperature:data.hourly.temperature_2m[i],humidity:data.hourly.relative_humidity_2m[i]}));
  res.json({location:'Beirut, Lebanon',sources:['Open-Meteo forecast'],hours,updatedAt:new Date().toISOString()});
 }catch(error){console.error('Forecast error:',error);res.status(502).json({error:'Forecast temporarily unavailable'});}
});
app.get('/api/sensor',(_req,res)=>res.json({latest:null,history:[],bridge:'not connected'}));
app.get('*',(_req,res)=>res.sendFile(process.cwd()+'/public/index.html'));
app.listen(port,'0.0.0.0',()=>console.log('Beirut Weather listening on '+port));