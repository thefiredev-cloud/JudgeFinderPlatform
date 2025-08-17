-- Sync Logging and Queue Management Tables
-- Run this SQL to add sync infrastructure to the database

-- Sync logs table for tracking all sync operations
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_id VARCHAR(100) NOT NULL,
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('court', 'judge', 'decision', 'full', 'cleanup')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
    options JSONB DEFAULT '{}',
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sync queue table for background job processing
CREATE TABLE IF NOT EXISTS sync_queue (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('court', 'judge', 'decision', 'full', 'cleanup')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    options JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 0,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook events table for tracking incoming webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL DEFAULT 'courtlistener',
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(100),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sync statistics table for tracking performance metrics
CREATE TABLE IF NOT EXISTS sync_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    avg_duration_ms INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, sync_type)
);

-- Add sync metadata columns to existing tables
ALTER TABLE courts ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS sync_source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE courts ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 1;

ALTER TABLE judges ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE judges ADD COLUMN IF NOT EXISTS sync_source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE judges ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 1;

ALTER TABLE cases ADD COLUMN IF NOT EXISTS sync_source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS sync_batch_id VARCHAR(100);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_id ON sync_logs(sync_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_type_status ON sync_logs(sync_type, status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status_priority ON sync_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduled_for ON sync_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sync_queue_type_status ON sync_queue(type, status);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_source_type ON webhook_events(source, event_type);

CREATE INDEX IF NOT EXISTS idx_sync_statistics_date_type ON sync_statistics(date, sync_type);

CREATE INDEX IF NOT EXISTS idx_courts_last_synced ON courts(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_judges_last_synced ON judges(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_cases_sync_batch ON cases(sync_batch_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_sync_logs_updated_at ON sync_logs;
CREATE TRIGGER update_sync_logs_updated_at
    BEFORE UPDATE ON sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_queue_updated_at ON sync_queue;
CREATE TRIGGER update_sync_queue_updated_at
    BEFORE UPDATE ON sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_statistics_updated_at ON sync_statistics;
CREATE TRIGGER update_sync_statistics_updated_at
    BEFORE UPDATE ON sync_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for sync dashboard
CREATE OR REPLACE VIEW sync_dashboard AS
SELECT 
    sl.sync_type,
    sl.status,
    COUNT(*) as count,
    AVG(sl.duration_ms) as avg_duration_ms,
    MAX(sl.started_at) as last_run,
    SUM(CASE WHEN sl.status = 'completed' THEN 1 ELSE 0 END) as successful_runs,
    SUM(CASE WHEN sl.status = 'failed' THEN 1 ELSE 0 END) as failed_runs
FROM sync_logs sl
WHERE sl.started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sl.sync_type, sl.status
ORDER BY sl.sync_type, sl.status;

-- View for queue status
CREATE OR REPLACE VIEW queue_status AS
SELECT 
    type,
    status,
    COUNT(*) as count,
    MIN(scheduled_for) as next_scheduled,
    AVG(retry_count) as avg_retries
FROM sync_queue
GROUP BY type, status
ORDER BY type, status;

-- Function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_sync_data(days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE(logs_deleted INTEGER, queue_cleaned INTEGER, webhooks_deleted INTEGER) AS $$
DECLARE
    logs_count INTEGER;
    queue_count INTEGER;
    webhooks_count INTEGER;
BEGIN
    -- Delete old sync logs
    DELETE FROM sync_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS logs_count = ROW_COUNT;
    
    -- Clean completed/failed queue items older than 7 days
    DELETE FROM sync_queue 
    WHERE status IN ('completed', 'failed', 'cancelled') 
    AND completed_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    GET DIAGNOSTICS queue_count = ROW_COUNT;
    
    -- Delete old webhook events
    DELETE FROM webhook_events 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS webhooks_count = ROW_COUNT;
    
    RETURN QUERY SELECT logs_count, queue_count, webhooks_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get sync health metrics
CREATE OR REPLACE FUNCTION get_sync_health()
RETURNS TABLE(
    metric_name TEXT,
    metric_value TEXT,
    status TEXT
) AS $$
BEGIN
    -- Queue health
    RETURN QUERY
    SELECT 
        'pending_jobs'::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) > 100 THEN 'warning'
            WHEN COUNT(*) > 50 THEN 'caution'
            ELSE 'good'
        END::TEXT
    FROM sync_queue WHERE status = 'pending';
    
    -- Recent sync success rate
    RETURN QUERY
    SELECT 
        'success_rate_24h'::TEXT,
        ROUND(
            100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / 
            NULLIF(COUNT(*), 0), 2
        )::TEXT || '%',
        CASE 
            WHEN ROUND(
                100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / 
                NULLIF(COUNT(*), 0), 2
            ) >= 90 THEN 'good'
            WHEN ROUND(
                100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / 
                NULLIF(COUNT(*), 0), 2
            ) >= 75 THEN 'caution'
            ELSE 'warning'
        END::TEXT
    FROM sync_logs 
    WHERE started_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    -- Data freshness
    RETURN QUERY
    SELECT 
        'last_decision_sync'::TEXT,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(completed_at)))::INTEGER::TEXT || ' seconds ago',
        CASE 
            WHEN MAX(completed_at) >= CURRENT_TIMESTAMP - INTERVAL '2 hours' THEN 'good'
            WHEN MAX(completed_at) >= CURRENT_TIMESTAMP - INTERVAL '6 hours' THEN 'caution'
            ELSE 'warning'
        END::TEXT
    FROM sync_logs 
    WHERE sync_type = 'decision' AND status = 'completed';
    
END;
$$ LANGUAGE plpgsql;