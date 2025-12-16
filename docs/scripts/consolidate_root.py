import os
import shutil

def append_file(src, dest, header=None):
    if not os.path.exists(src):
        print(f"Skipping {src} (not found)")
        return
    
    print(f"Appending {src} to {dest}...")
    with open(dest, 'a', encoding='utf-8') as f:
        f.write("\n\n---\n\n")
        if header:
            f.write(f"# {header}\n\n")
        with open(src, 'r', encoding='utf-8') as infile:
            f.write(infile.read())
    # os.remove(src) # Wait to verify

def move_file(src, dest):
    if not os.path.exists(src):
        return
    print(f"Moving {src} to {dest}...")
    shutil.move(src, dest)

# 1. AI Features -> features/ai-assistant.md
append_file('docs/AI_FEATURES.md', 'docs/features/ai-assistant.md', 'Technical Implementation Reference')

# 2. Pages Workflow -> features/desktop-experience.md
move_file('docs/PAGES_WORKFLOW.md', 'docs/features/desktop-experience.md')

# 3. Guides
move_file('docs/ONBOARDING.md', 'docs/guides/getting-started.md')
move_file('docs/TROUBLESHOOTING.md', 'docs/guides/troubleshooting.md')
move_file('docs/database_migration_guide.md', 'docs/guides/database-migration.md')
move_file('docs/DOCUMENTATION_SYNC.md', 'docs/guides/documentation-maintenance.md')

# 4. API & Deployment READMEs
# If dest exists, we might overwrite or append. Let's start fresh if it's a generic index.
if os.path.exists('docs/API.md'):
    move_file('docs/API.md', 'docs/api/README.md')

if os.path.exists('docs/DEPLOYMENT.md'):
    move_file('docs/DEPLOYMENT.md', 'docs/deployment/README.md')

# 5. Planning
if not os.path.exists('docs/planning'):
    os.makedirs('docs/planning')
move_file('docs/IMPLEMENTATION_STATUS.md', 'docs/planning/implementation-status.md')

# 6. Documentation Index (Redundant, merge contents to root README if needed, or just delete)
# Reading it first might be good, but user wants to dissolve. 
# Identifying unique content... usually just an index.
# We will delete it in the cleanup phase if it's just a list.

print("Root consolidation actions complete. Please verify.")
