create table agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  parent_task_id uuid references agent_tasks(id),
  sub_agent_id text,
  title text not null,
  description text,
  status text not null default 'pending',
  score integer,
  auto_executed boolean default false,
  escalation jsonb,
  checkpoint_data jsonb,
  token_usage integer,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  task_id uuid references agent_tasks(id),
  action text not null,
  details jsonb,
  created_at timestamp default now()
);

create table agent_memory (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  key text not null,
  value jsonb not null,
  expires_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(agent_id, key)
);
