import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
export async function OPTIONS(){return new Response(null,{status:204,headers:cors})}
export async function GET(){
 try {const db=(env as any).DB; const [entries, selection]=await Promise.all([db.prepare('SELECT id,name,food,address,category FROM lunch_entries ORDER BY created_at DESC LIMIT 200').all(),db.prepare("SELECT name,food,address,updated_at FROM lunch_selection WHERE id = 'today'").first()]); return json({entries:entries.results,selection});}catch{return json({error:'資料暫時無法讀取'},503)}
}
export async function POST(request:Request){
 try {const raw=await request.text();if(raw.length>2000)return json({error:'資料過長'},400);const data=JSON.parse(raw);let clean=(x:unknown,max:number)=>typeof x==='string'?x.trim().slice(0,max):'';const name=clean(data.name,50),food=clean(data.food,80),address=clean(data.address,100);if(!name||!food)return json({error:'請填寫店名與餐點'},400);const db=(env as any).DB;
 if(data.action==='selection'){await db.prepare("INSERT INTO lunch_selection (id,name,food,address,updated_at) VALUES ('today',?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,food=excluded.food,address=excluded.address,updated_at=excluded.updated_at").bind(name,food,address,Date.now()).run();return json({ok:true})}
 if(data.action==='add'){const allowed=['便當餐盒','水餃麵食','台式小吃','其他'];const category=allowed.includes(data.category)?data.category:'其他';const id=crypto.randomUUID();await db.prepare('INSERT INTO lunch_entries (id,name,food,address,category,created_at) VALUES (?,?,?,?,?,?)').bind(id,name,food,address,category,Date.now()).run();return json({ok:true,id})}return json({error:'不支援的操作'},400)
 }catch{return json({error:'資料暫時無法儲存'},503)}
}
export async function DELETE(request:Request){try{const id=new URL(request.url).searchParams.get('id');if(!id||!/^[a-f0-9-]{36}$/.test(id))return json({error:'資料無效'},400);await (env as any).DB.prepare('DELETE FROM lunch_entries WHERE id=?').bind(id).run();return json({ok:true})}catch{return json({error:'刪除失敗'},503)}}
