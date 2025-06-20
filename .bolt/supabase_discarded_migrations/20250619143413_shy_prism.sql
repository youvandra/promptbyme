/*
  # Add Project Members Table for Team Invitations

  1. New Tables
    - `project_members`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `user_id` (uuid, foreign key to users)
      - `invited_by_user_id` (uuid, foreign key to users)
      - `role` (text, enum: viewer, editor, admin)
      - `status` (text, enum: pending, accepted, declined)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `project_members` table
    - Add policies for team member management
    - Ensure only project admins can invite/remove members
    - Allow users to manage their own invitations

  3. Constraints
    - Unique constraint on (project_id, user_id)
    - Check constraints for role and status values