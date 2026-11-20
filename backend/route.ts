import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
const categories = ['便當餐盒','水餃麵食','台式小吃','其他'];
const clean=(x:unknown,max:number)=>typeof x==='string'?x.trim().slice(0,max):'';
export async function OPTIONS(){return new Response(null,{status:204,headers:cors})}
export async function GET(){
 try {const db=(env as any).DB;const [entries,selection,overrides]=await Promise.all([db.prepare('SELECT id,name,food,address,category FROM lunch_entries ORDER BY created_at DESC LIMIT 200').all(),db.prepare("SELECT name,food,address,updated_at FROM lunch_selection WHERE id = 'today'").first(),db.prepare('SELECT id,details,deleted FROM lunch_store_overrides LIMIT 500').all()]);return json({entries:entries.results,selection,overrides:overrides.results})}catch{return json({error:'資料暫時無法讀取'},503)}
}
export async function POST(request:Request){
 try {const raw=await request.text();if(raw.length>30000)return json({error:'資料過長'},400);const data=JSON.parse(raw);const db=(env as any).DB;
 if(data.action==='save_store' || data.action==='delete_store'){
  const id=clean(data.id,180);if(!/^(b:.+|c:[a-f0-9-]{36})$/.test(id))return json({error:'店家資料無效'},400);
  if(data.action==='delete_store'){await db.prepare("INSERT INTO lunch_store_overrides (id,details,deleted) VALUES (?, '{}', 1) ON CONFLICT(id) DO UPDATE SET deleted=1").bind(id).run();return json({ok:true})}
  const name=clean(data.name,50),address=clean(data.address,100),category=categories.includes(data.category)?data.category:'其他';
  const source=clean(data.source,500);if(source){try{const u=new URL(source);if(!['http:','https:'].includes(u.protocol))throw Error()}catch{return json({error:'菜單網址無效'},400)}}
  if(!name||!Array.isArray(data.menu)||data.menu.length<1||data.menu.length>60)return json({error:'請填店名及至少一項餐點'},400);
  let menu=[];for(const item of data.menu){const dish=clean(item?.name,80);const price=item?.price;if(!dish||!(price===null||(typeof price==='number'&&Number.isFinite(price)&&price>=0&&price<=100000)))return json({error:'餐點資料無效'},400);menu.push({name:dish,price})}
  const details=JSON.stringify({name,address,category,source,menu});await db.prepare('INSERT INTO lunch_store_overrides (id,details,deleted) VALUES (?,?,0) ON CONFLICT(id) DO UPDATE SET details=excluded.details, deleted=0').bind(id,details).run();return json({ok:true})
 }
 const name=clean(data.name,50),food=clean(data.food,1000),address=clean(data.address,100);if(!name||!food)return json({error:'請填寫店名與餐點'},400);
 if(data.action==='selection'){await db.prepare("INSERT INTO lunch_selection (id,name,food,address,updated_at) VALUES ('today',?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,food=excluded.food,address=excluded.address,updated_at=excluded.updated_at").bind(name,food,address,Date.now()).run();return json({ok:true})}
 if(data.action==='add'){const category=categories.includes(data.category)?data.category:'其他';const id=crypto.randomUUID();await db.prepare('INSERT INTO lunch_entries (id,name,food,address,category,created_at) VALUES (?,?,?,?,?,?)').bind(id,name,food,address,category,Date.now()).run();return json({ok:true,id})}return json({error:'不支援的操作'},400)
 }catch{return json({error:'資料暫時無法儲存'},503)}
}
export async function DELETE(request:Request){try{const id=new URL(request.url).searchParams.get('id');if(!id||!/^[a-f0-9-]{36}$/.test(id))return json({error:'資料無效'},400);await (env as any).DB.prepare('DELETE FROM lunch_entries WHERE id=?').bind(id).run();return json({ok:true})}catch{return json({error:'刪除失敗'},503)}}
