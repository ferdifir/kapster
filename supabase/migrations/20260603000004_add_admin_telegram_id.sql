ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_id text UNIQUE;

CREATE OR REPLACE FUNCTION exec_sql(query_text text)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE query_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION exec_sql FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
