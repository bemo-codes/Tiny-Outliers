"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Hospitals
    op.create_table(
        'hospitals',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False, index=True),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True, index=True),
        sa.Column('tier', sa.String(length=50), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False, index=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=False),
        sa.Column('emergency_direct_line', sa.String(length=50), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('operational_status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('total_capacity', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('current_occupancy', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_synthetic', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('latitude >= -90 AND latitude <= 90', name='chk_hospital_latitude'),
        sa.CheckConstraint('longitude >= -180 AND longitude <= 180', name='chk_hospital_longitude')
    )

    # 2. Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, index=True),
        sa.Column('hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 3. Hospital Resources
    op.create_table(
        'hospital_resources',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('resource_type', sa.String(length=50), nullable=False, index=True),
        sa.Column('resource_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('available_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unit', sa.String(length=50), nullable=False, server_default='units'),
        sa.Column('availability_status', sa.String(length=50), nullable=False, server_default='available', index=True),
        sa.Column('attributes', sa.JSON(), nullable=False),
        sa.Column('updated_by_user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('available_quantity >= 0', name='chk_resource_available_qty'),
        sa.CheckConstraint('total_quantity >= 0', name='chk_resource_total_qty')
    )

    # 4. Hospital Capabilities
    op.create_table(
        'hospital_capabilities',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('capability_code', sa.String(length=100), nullable=False, index=True),
        sa.Column('capability_name', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 5. Hospital Staff Availability
    op.create_table(
        'hospital_staff_availability',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('specialty', sa.String(length=100), nullable=False, index=True),
        sa.Column('on_duty_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('on_call_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_available_now', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('shift_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 6. Patients
    op.create_table(
        'patients',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('identifier', sa.String(length=100), nullable=False, unique=True),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('medical_history', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 7. Emergency Requests
    op.create_table(
        'emergency_requests',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('patients.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_by_user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False, index=True),
        sa.Column('severity', sa.String(length=50), nullable=False, index=True),
        sa.Column('symptoms', sa.Text(), nullable=False),
        sa.Column('vitals', sa.JSON(), nullable=False),
        sa.Column('required_capabilities', sa.JSON(), nullable=False),
        sa.Column('required_resources', sa.JSON(), nullable=False),
        sa.Column('patient_latitude', sa.Float(), nullable=True),
        sa.Column('patient_longitude', sa.Float(), nullable=True),
        sa.Column('location_address', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='submitted', index=True),
        sa.Column('accepted_hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 8. Hospital Matches
    op.create_table(
        'hospital_matches',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('emergency_id', sa.String(length=36), sa.ForeignKey('emergency_requests.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('match_score', sa.Float(), nullable=False),
        sa.Column('eta_minutes', sa.Float(), nullable=True),
        sa.Column('distance_km', sa.Float(), nullable=True),
        sa.Column('eligibility_status', sa.String(length=50), nullable=False, index=True),
        sa.Column('missing_requirements', sa.JSON(), nullable=False),
        sa.Column('reasons', sa.JSON(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('resource_snapshot_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 9. Hospital Confirmations
    op.create_table(
        'hospital_confirmations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('emergency_id', sa.String(length=36), sa.ForeignKey('emergency_requests.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending', index=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('decided_by_user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reserved_resources', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 10. Ambulances
    op.create_table(
        'ambulances',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('call_sign', sa.String(length=50), nullable=False, unique=True, index=True),
        sa.Column('vehicle_type', sa.String(length=50), nullable=False, server_default='ALS'),
        sa.Column('current_latitude', sa.Float(), nullable=True),
        sa.Column('current_longitude', sa.Float(), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('assigned_hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id', ondelete='SET NULL'), nullable=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 11. Ambulance Assignments
    op.create_table(
        'ambulance_assignments',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('emergency_id', sa.String(length=36), sa.ForeignKey('emergency_requests.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('ambulance_id', sa.String(length=36), sa.ForeignKey('ambulances.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('assigned_by_user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('driver_name', sa.String(length=255), nullable=False, server_default='Staff Paramedic'),
        sa.Column('assignment_status', sa.String(length=50), nullable=False, server_default='assigned', index=True),
        sa.Column('estimated_arrival_minutes', sa.Float(), nullable=True),
        sa.Column('timeline', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 12. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('actor_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('action', sa.String(length=100), nullable=False, index=True),
        sa.Column('entity_type', sa.String(length=100), nullable=False, index=True),
        sa.Column('entity_id', sa.String(length=36), nullable=False, index=True),
        sa.Column('payload_before', sa.JSON(), nullable=True),
        sa.Column('payload_after', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, index=True)
    )

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('ambulance_assignments')
    op.drop_table('ambulances')
    op.drop_table('hospital_confirmations')
    op.drop_table('hospital_matches')
    op.drop_table('emergency_requests')
    op.drop_table('patients')
    op.drop_table('hospital_staff_availability')
    op.drop_table('hospital_capabilities')
    op.drop_table('hospital_resources')
    op.drop_table('users')
    op.drop_table('hospitals')
