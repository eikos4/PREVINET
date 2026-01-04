-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: Empresas
create table if not exists empresas (
  id uuid primary key default uuid_generate_v4(),
  nombre_razon_social text not null,
  rut text not null unique,
  tipo text not null, -- mandante, contratista, etc.
  giro text not null,
  estado text not null default 'activa',
  clasificacion text, -- grande_constructora, independiente
  creado_en timestamptz default now()
);

-- Table: Obras
create table if not exists obras (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  estado text not null default 'activa',
  empresa_id uuid references empresas(id) on delete cascade,
  creado_en timestamptz default now()
);

-- Table: Workers (Trabajadores)
create table if not exists workers (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  rut text not null unique,
  cargo text,
  telefono text,
  empresa_nombre text, -- Denormalized for convenience
  empresa_rut text,    -- Denormalized
  obra_asignada text,  -- Just a text reference or link? In Dexie it was 'obra' string.
  pin text,
  habilitado boolean default true,
  creado_en timestamptz default now()
);

-- Table: Users (Usuarios de la App)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  pin text not null,
  role text not null, -- trabajador, prevencionista, etc.
  worker_id uuid references workers(id) on delete set null,
  company_id uuid references empresas(id) on delete set null,
  company_name text,
  company_rut text,
  creado_en timestamptz default now()
);

-- Table: ART
create table if not exists art (
  id uuid primary key default uuid_generate_v4(),
  obra text,
  fecha text,
  riesgos text,
  cerrado boolean default false,
  creado_por_user_id uuid,
  asignados jsonb default '[]',
  trabajadores jsonb default '[]',
  creado_en timestamptz default now()
);

-- Table: IRL
create table if not exists irl (
  id uuid primary key default uuid_generate_v4(),
  obra text,
  fecha text,
  titulo text,
  descripcion text,
  estado text,
  creado_por_user_id uuid,
  asignados jsonb default '[]',
  creado_en timestamptz default now()
);

-- Row Level Security (RLS) Policies (Optional for Demo, Recommended for Prod)
alter table empresas enable row level security;
alter table obras enable row level security;
alter table workers enable row level security;
alter table users enable row level security;
alter table art enable row level security;
alter table irl enable row level security;

-- Simple policy: Public read for demo (or restrict later)
create policy "Allow public read" on empresas for select using (true);
create policy "Allow public read" on obras for select using (true);
create policy "Allow public read" on workers for select using (true);
create policy "Allow public read" on users for select using (true);
create policy "Allow public read" on art for select using (true);
create policy "Allow public read" on irl for select using (true);

-- Allow public insert/update for demo purposes (Careful!)
create policy "Allow public all" on empresas for all using (true);
create policy "Allow public all" on obras for all using (true);
create policy "Allow public all" on workers for all using (true);
create policy "Allow public all" on users for all using (true);
create policy "Allow public all" on art for all using (true);
create policy "Allow public all" on irl for all using (true);
