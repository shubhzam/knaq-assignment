-- CreateTable
CREATE TABLE "Device" (
    "device_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "floor_count" INTEGER,
    "installed_date" TEXT NOT NULL,
    "reading_types" TEXT[],
    "thresholds" JSONB NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "input_name" TEXT NOT NULL,
    "input_value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL,
    "threshold" DOUBLE PRECISION,
    "reading_value" DOUBLE PRECISION,
    "reading_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "assigned_to" INTEGER,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution_type" TEXT,
    "resolution_root_cause" TEXT,
    "resolution_action_taken" TEXT,
    "resolution_preventive_measures" TEXT,
    "resolution_time_spent_minutes" INTEGER,
    "timeline" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Device_company_idx" ON "Device"("company");

-- CreateIndex
CREATE INDEX "Reading_device_id_timestamp_idx" ON "Reading"("device_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Reading_device_id_timestamp_input_name_key" ON "Reading"("device_id", "timestamp", "input_name");

-- CreateIndex
CREATE UNIQUE INDEX "User_token_key" ON "User"("token");

-- CreateIndex
CREATE INDEX "User_company_idx" ON "User"("company");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_device_id_triggered_at_alert_type_key" ON "Alert"("device_id", "triggered_at", "alert_type");

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "Device"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "Device"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
