# Database Migration Guide

## Status: Ready for Manual Migration ✅

**UPDATED**: SQL syntax errors have been fixed. Use the corrected migration file.

## Quick Steps

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/xstlnicbnzdxlgfiewmg/sql

2. **Execute Fixed Migration**:
   - Copy all content from `scripts/fixed-migrations.sql` ⚡ **USE THIS FILE**
   - Paste and run in SQL editor
   - This file contains all fixes for PostgreSQL syntax compatibility

3. **Verify**: Run `node scripts/migration-direct.js`

## What Was Fixed

- ❌ **Old Issue**: `ADD CONSTRAINT IF NOT EXISTS` syntax error
- ✅ **Fixed**: Proper PostgreSQL DO blocks for constraint creation
- ✅ **Enhanced**: Added existence checks for policies and triggers
- ✅ **Improved**: Better error handling and verification queries

## What Gets Created

### User Tables
- `user_bookmarks` - User saved judges
- `user_preferences` - User settings  
- `user_activity` - Usage tracking
- `user_saved_searches` - Saved search queries
- `user_notifications` - System notifications

### Judge Enhancements
- `judges.slug` column for SEO URLs
- Automatic slug generation for all existing judges
- Unique constraints and indexes

## After Migration
- Bookmark functionality will work
- User preferences will persist
- Judge URLs will be SEO-friendly
- User dashboard will be fully functional