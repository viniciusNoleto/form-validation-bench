import { z } from 'zod';
const s = z.object({
  name: z.string().trim().min(1, 'Obrigatório').default(''),
  age: z.number().nullable().default(null),
  address: z.object({ city: z.string().min(1).default(''), zip: z.string().default('') }).prefault({}),
  tags: z.array(z.string()).min(1, 'Ao menos 1').default([]),
  items: z.array(z.object({ title: z.string().min(1).default('') })).default([]),
  password: z.string().min(8).default(''),
  confirm: z.string().default(''),
}).refine(v => v.password === v.confirm, { message: 'Senhas diferentes', path: ['confirm'] });
console.log('defaults via parse({}) =>', JSON.stringify(s.parse({})));
try { console.log(JSON.stringify(s.parse({}))) } catch(e) { console.log('parse({}) throws', e.issues.map(i=>i.path.join('.')+':'+i.message)) }
// default bypass?
console.log('default bypasses min:', z.string().min(1).default('').safeParse(undefined));
const r = s.safeParse({ name:'', age:null, address:{city:'',zip:''}, tags:[], items:[{title:''}], password:'abc', confirm:'abd' });
console.log(r.error.issues.map(i=>JSON.stringify(i.path)+' '+i.message));
const r2 = s.safeParse({ name:'a', age:null, address:{city:'x',zip:''}, tags:['a'], items:[], password:'abcdefgh', confirm:'abd' });
console.log(r2.error.issues.map(i=>JSON.stringify(i.path)+' '+i.message));
const s3 = z.object({ password: z.string().min(8).default(''), confirm: z.string().default('') }).refine(v => v.password === v.confirm, { message: 'Senhas diferentes', path: ['confirm'], when: (p) => p.issues.every(i => i.path?.[0] !== 'confirm') });
console.log('with when:', s3.safeParse({password:'abc', confirm:'abd'}).error.issues.map(i=>JSON.stringify(i.path)+' '+i.message));
console.log('shape access', Object.keys(s.def?.shape ?? s.shape ?? {}), typeof s.shape);
