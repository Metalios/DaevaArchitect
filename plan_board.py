from pathlib import Path
import heapq
import json

boards=json.loads(Path('templar-pathfinder/boards.json').read_text(encoding='utf8'))[:4]
routes=json.loads(Path('templar-pathfinder/route149.json').read_text(encoding='utf8'))
skills=json.loads(Path('templar-pathfinder/skills.json').read_text(encoding='utf8'))
byname={b['name']:b for b in boards}
byid={n[0]:(b,n) for b in boards for n in b['nodes']}

def shortest(board, owned, target):
    nodes={n[0]:n for n in board['nodes']}
    pos={(n[1],n[2]):n[0] for n in nodes.values()}
    adj={i:[pos[q] for q in ((n[1]-1,n[2]),(n[1]+1,n[2]),(n[1],n[2]-1),(n[1],n[2]+1)) if q in pos] for i,n in nodes.items()}
    start=[n[0] for n in nodes.values() if n[5]==0]
    pq=[(0,i) for i in set(owned)|set(start)]
    heapq.heapify(pq)
    dist={i:0 for _,i in pq}
    parent={}
    while pq:
        d,i=heapq.heappop(pq)
        if d!=dist[i]: continue
        if i==target: break
        for j in adj[i]:
            nd=d+(0 if j in owned else nodes[j][5])
            if nd<dist.get(j,10**8):
                dist[j]=nd; parent[j]=i; heapq.heappush(pq,(nd,j))
    if target not in dist: return None
    path=[]; cur=target
    while cur in parent:
        if cur not in owned and nodes[cur][5]: path.append(cur)
        cur=parent[cur]
    path.reverse()
    return path

def map_graph(board):
    nodes={n[0]:n for n in board['nodes']}
    pos={(n[1],n[2]):n[0] for n in nodes.values()}
    adj={i:[pos[q] for q in ((n[1]-1,n[2]),(n[1]+1,n[2]),(n[1],n[2]-1),(n[1],n[2]+1)) if q in pos] for i,n in nodes.items()}
    return nodes,adj

def paths(board, owned):
    nodes,adj=map_graph(board)
    free={n[0] for n in nodes.values() if n[5]==0}
    pq=[(0,i) for i in owned|free]
    heapq.heapify(pq)
    dist={i:0 for _,i in pq}
    parent={}
    while pq:
        d,i=heapq.heappop(pq)
        if d!=dist[i]: continue
        for j in adj[i]:
            nd=d+(0 if j in owned else nodes[j][5])
            if nd<dist.get(j,10**8):
                dist[j]=nd; parent[j]=i; heapq.heappush(pq,(nd,j))
    out={}
    for i in nodes:
        if i in owned or nodes[i][5]==0 or i not in dist: continue
        path=[]; cur=i
        while cur in parent:
            if cur not in owned and nodes[cur][5]: path.append(cur)
            cur=parent[cur]
        out[i]=list(reversed(path))
    return out

skill_w={'Judgment':14,'Vicious Strike':11,'Pummel':9,'Punishment':9,
 'Fury':7,'Insulting Roar':6,'Warding Strike':5,'Shield Smite':4,
 'Impact Hit':3.5,'Punishing Benediction':2,'Annihilate':2,
 'Ironclad Defense':2,'Enhance Health':2,'Block Pain':1.5,
 'Warding Shield':1.3,'Guarding Seal':1.2,'Survival Willpower':1.2,
 'Poach':1,'Shield Rush':1,'Debilitating Smash':1,'Defiance':1,'Flash Rampage':0.5}
stat_w={'FixingDamage':1.2,'Critical':0.8,'CriticalResist':0.5,
 'Defense':0.7,'HPMax':0.7,'MPMax':0.1,
 'CombatSpeed':25,'CoolTimeDecrease':22,'DecreaseDamage':22,
 'AmplifyAllDamage':25,'AmplifyCriticalDamage':16,'DecreaseCriticalDamage':7,
 'AdditionalHitRate':15,'AdditionalHitResistRate':6}

def value(node):
    if not node[6]: return 0
    key=node[6][0][0]
    if isinstance(key,int):
        return skill_w.get(skills.get(str(key),{}).get('name',''),0.5)
    return stat_w.get(key,0.2)

owned={b['name']:set(routes[b['name']]) for b in boards}
plan=[{'board':name,'id':i} for name in ('Nezekan','Zikel','Vaizel','Triniel') for i in routes[name]]
for key in ('CombatSpeed','CoolTimeDecrease'):
    b=byname['Nezekan']
    for target in [n for n in b['nodes'] if n[6] and n[6][0][0]==key]:
        path=shortest(b, owned[b['name']], target[0])
        print(key,target[0],sum(byid[i][1][5] for i in path),len(path),[(byid[i][1][1],byid[i][1][2]) for i in path])
        owned[b['name']].update(path)
        plan.extend({'board':b['name'],'id':i} for i in path)

while any(len(owned[b['name']])<len(b['nodes'])-1 for b in boards):
    best=None
    for b in boards:
        name=b['name']
        for target,path in paths(b,owned[name]).items():
            if not path: continue
            cost=sum(byid[i][1][5] for i in path)
            reward=sum(value(byid[i][1]) for i in path)
            score=reward/cost + value(byid[target][1])/(cost*20)
            candidate=(score,-cost,-target,name,path)
            if best is None or candidate[:3]>best[:3]: best=candidate
    if best is None: break
    _,_,_,name,path=best
    for i in path:
        if i not in owned[name]:
            owned[name].add(i)
            plan.append({'board':name,'id':i})

total=sum(byid[x['id']][1][5] for x in plan)
print('plan',len(plan),total)
spent=0
for x in plan:
    spent+=byid[x['id']][1][5]
    if 215 <= spent <= 221:
        print('near 218',spent,x['board'],x['id'],byid[x['id']][1][6])
Path('templar-pathfinder/route.json').write_text(json.dumps(plan,separators=(',',':')),encoding='utf8')
spent=0; counts={b['name']:0 for b in boards}; effect={}
for x in plan:
    n=byid[x['id']][1]
    if spent+n[5]>218: break
    spent+=n[5]; counts[x['board']]+=n[5]
    for k,v in n[6]:
        name=skills.get(str(k),{}).get('name',str(k)) if isinstance(k,int) else k
        effect[name]=effect.get(name,0)+v
print('218 summary',spent,counts,{k:v for k,v in effect.items() if k in ['Judgment','Vicious Strike','Pummel','Punishment','Fury','Warding Strike','Impact Hit','CombatSpeed','CoolTimeDecrease','AmplifyAllDamage','DecreaseDamage']})
seen={b['name']:{n[0] for n in b['nodes'] if n[5]==0} for b in boards}
for ix,x in enumerate(plan,1):
    b,n=byid[x['id']]
    positions={(m[1],m[2]) for m in b['nodes'] if m[0] in seen[x['board']]}
    if not any((n[1]+dr,n[2]+dc) in positions for dr,dc in ((-1,0),(1,0),(0,-1),(0,1))):
        raise ValueError(f'disconnected step {ix}: {x}')
    seen[x['board']].add(x['id'])
print('connected route verified')
