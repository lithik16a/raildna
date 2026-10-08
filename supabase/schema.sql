-- PostgreSQL / Supabase equivalent of src/database/schema.ts.
-- The MVP runs on SQLite for zero-setup demos; apply this file to a Supabase project and
-- re-implement src/database/repositories/* with the Supabase client to switch.
-- Enable Row Level Security and add policies before exposing any table to the public API.

create table users (
  id            bigint generated always as identity primary key,
  email         text not null unique,
  name          text not null,
  role          text not null default 'FIELD_ENGINEER',
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table assets (
  id                bigint generated always as identity primary key,
  asset_id          text not null unique,
  asset_type        text not null check (asset_type in ('Fishplate','Rail Clip','Base Plate','Sleeper','Fastener')),
  location          text not null,
  latitude          double precision not null,
  longitude         double precision not null,
  installation_date date not null,
  condition         text check (condition in ('Good','Moderate','High Risk')),
  risk_score        int  check (risk_score between 0 and 100),
  status            text not null default 'Active' check (status in ('Active','Under Maintenance')),
  last_inspection   date,
  next_inspection   date,
  created_at        timestamptz not null default now()
);

create table inspections (
  id              bigint generated always as identity primary key,
  asset_id        text not null references assets(asset_id) on delete cascade,
  inspection_date date not null,
  inspection_type text not null,
  inspector       text not null,
  image_url       text,
  condition       text not null check (condition in ('Good','Moderate','High Risk')),
  risk_score      int  not null check (risk_score between 0 and 100),
  findings        text not null default '',
  recommendation  text not null default '',
  risk_factors    jsonb not null default '[]',
  engine          text,
  created_at      timestamptz not null default now()
);

create table inspection_findings (
  id            bigint generated always as identity primary key,
  inspection_id bigint not null references inspections(id) on delete cascade,
  finding_type  text not null,
  label         text not null,
  detected      boolean not null,
  confidence    real not null check (confidence between 0 and 1)
);

create table maintenance_records (
  id           bigint generated always as identity primary key,
  asset_id     text not null references assets(asset_id) on delete cascade,
  issue        text not null,
  priority     text not null check (priority in ('Low','Medium','High','Critical')),
  assigned_to  text not null,
  status       text not null default 'Due' check (status in ('Due','Scheduled','In Progress','Completed')),
  due_date     date not null,
  notes        text not null default '',
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index on inspections (asset_id, inspection_date);
create index on inspection_findings (inspection_id);
create index on maintenance_records (asset_id, status);
