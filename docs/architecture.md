# FERRCS — System Architecture & Runbook

## Overview
**FERRCS (Flood Emergency Response & Rescue Coordination System)** is a mission-critical crisis coordination platform built for high-stress natural disasters (specifically urban and rural river flooding).

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui (Radix primitives), `lucide-react`, `class-variance-authority`.
- **Backend:** Supabase (PostgreSQL 15, PostGIS, Row Level Security, Realtime, Storage, Edge Functions).
- **Offline / PWA:** Service Worker shell caching, IndexedDB outbox with client idempotency UUIDs, SMS fallback.
- **Internationalization:** Multi-lingual support with English (`en`), Telugu (`te`), and Hindi (`hi`).

## Database Migrations
1. `20261001000001_extensions_and_enums.sql`: PostGIS, pgcrypto, custom enums (`user_role`, `verification_status`, `request_status`, `urgency_level`, etc.).
2. `20261001000002_core_tables.sql`: 15 tables with spatial GiST indexes and integrity constraints.
3. `20261001000003_rls_policies.sql`: Default-deny Row Level Security on all public tables. Role verification and security definer helper functions (`get_my_role()`, `is_admin()`, `protect_profile_role_fields()`).
4. `20261001000004_rpcs_and_state_machine.sql`: `handle_new_user()`, `admin_set_user_role()`, `admin_verify_user()`, `generate_short_code()`, `public_stats()`.

## Demo Accounts
- **Admin:** `admin@ferrcs.demo` / `Password123!`
- **Citizen 1:** `citizen1@ferrcs.demo` / `Password123!`
- **Citizen 2:** `citizen2@ferrcs.demo` / `Password123!`
- **Rescue Team 1:** `rescue1@ferrcs.demo` / `Password123!`
- **Rescue Team 2:** `rescue2@ferrcs.demo` / `Password123!`
- **Volunteer 1:** `volunteer1@ferrcs.demo` / `Password123!`
