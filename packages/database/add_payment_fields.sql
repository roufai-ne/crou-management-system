-- Add payment fields to housing_occupancies
ALTER TABLE housing_occupancies ADD COLUMN IF NOT EXISTS is_rent_paid boolean NOT NULL DEFAULT false;
ALTER TABLE housing_occupancies ADD COLUMN IF NOT EXISTS last_rent_payment_date TIMESTAMP NULL;
ALTER TABLE housing_occupancies ADD COLUMN IF NOT EXISTS contract_file_url character varying(500) NULL;
ALTER TABLE housing_occupancies ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMP NULL;
ALTER TABLE housing_occupancies ADD COLUMN IF NOT EXISTS cancellation_reason text NULL;
ALTER TABLE housing_occupancies ADD COLUMN IF NOT EXISTS "anneeUniversitaire" character varying(20) NULL;

-- Create index
CREATE INDEX IF NOT EXISTS "IDX_housing_occupancies_rent_paid" ON housing_occupancies (is_rent_paid, status);

SELECT 'Migration completed successfully' as result;
