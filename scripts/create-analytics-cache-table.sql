-- Create judge analytics cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS judge_analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    analytics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one cache entry per judge
    UNIQUE(judge_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_judge_analytics_cache_judge_id ON judge_analytics_cache(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_analytics_cache_updated_at ON judge_analytics_cache(updated_at DESC);

-- Enable RLS
ALTER TABLE judge_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for analytics cache
CREATE POLICY "Analytics cache is viewable by everyone" ON judge_analytics_cache
    FOR SELECT USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_judge_analytics_cache_updated_at 
    BEFORE UPDATE ON judge_analytics_cache
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add index on analytics JSONB for faster queries
CREATE INDEX IF NOT EXISTS idx_judge_analytics_cache_analytics ON judge_analytics_cache USING gin (analytics);