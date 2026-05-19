ALTER TABLE barbershops
  ALTER COLUMN wuzapi_user_id TYPE varchar USING wuzapi_user_id::varchar;
