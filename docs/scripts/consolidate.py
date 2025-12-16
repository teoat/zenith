import os
import shutil

# Helper to distinct merge files
def merge_files(sources, dest):
    print(f"Merging to {dest}...")
    with open(dest, 'w', encoding='utf-8') as outfile:
        for i, src in enumerate(sources):
            if os.path.exists(src):
                if i > 0:
                    outfile.write("\n\n---\n\n") # Separator
                with open(src, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    # Add a header note if it's the second file (usually the technical spec)
                    if i == 1: 
                        outfile.write("# Technical Specification\n\n")
                    outfile.write(content)
                # os.remove(src) # Don't delete yet, verify first
            else:
                print(f"Warning: Source {src} not found")

# 1. Dashboard
merge_files(
    ['docs/features/01_DASHBOARD.md', 'docs/specifications/02_DASHBOARD.md'],
    'docs/features/dashboard.md'
)

# 2. Cases
merge_files(
    ['docs/features/02_CASES.md', 'docs/specifications/03_CASES.md'],
    'docs/features/cases.md'
)

# 3. Evidence (Feature + Ingestion Spec + Forensics Spec)
merge_files(
    ['docs/features/04_EVIDENCE.md', 'docs/specifications/04_INGESTION.md', 'docs/specifications/05_FORENSICS.md'],
    'docs/features/evidence-and-forensics.md'
)

# 4. Reconciliation
merge_files(
    ['docs/features/05_RECONCILIATION.md', 'docs/specifications/07_RECONCILIATION.md'],
    'docs/features/reconciliation.md'
)

# 5. Reporting (Feature + Summary Spec)
merge_files(
    ['docs/features/06_REPORTING.md', 'docs/specifications/09_SUMMARY.md'],
    'docs/features/reporting.md'
)

# 6. Settings
merge_files(
    ['docs/features/07_SETTINGS.md', 'docs/specifications/11_SETTINGS.md'],
    'docs/features/settings.md'
)

# 7. Visualization
if os.path.exists('docs/specifications/08_VISUALIZATION.md'):
    shutil.copy('docs/specifications/08_VISUALIZATION.md', 'docs/features/visualization.md')

# 8. AI Assistant (Strategy + Spec + Completion Plan)
merge_files(
    ['docs/strategy/00_STRATEGY_FRENLY_AI.md', 'docs/specifications/10_FRENLY_AI_ASSISTANT.md', 'docs/specifications/FRENLY_AI_IMPLEMENTATION_COMPLETION.md'],
    'docs/features/ai-assistant.md'
)

# 9. Single files
moves = [
    ('docs/specifications/06_ADJUDICATION_QUEUE.md', 'docs/features/adjudication.md'),
    ('docs/specifications/01_LOGIN.md', 'docs/features/authentication.md'),
    ('docs/specifications/12_ERROR_PAGES.md', 'docs/features/error-handling.md'),
    ('docs/strategy/00_STRATEGY_PERFORMANCE.md', 'docs/architecture/performance.md'),
    ('docs/strategy/00_STRATEGY_INTERACTIVITY.md', 'docs/architecture/interactivity.md'),
    ('docs/strategy/00_STRATEGY_ACCESSIBILITY.md', 'docs/architecture/accessibility.md'),
    ('docs/strategy/00_STRATEGY_USER_JOURNEY.md', 'docs/strategy/user-journey.md'),
    ('docs/strategy/00_STRATEGY_FRAUD_MECHANICS.md', 'docs/strategy/fraud-mechanics.md'),
    ('docs/strategy/00_STRATEGY_ONBOARDING.md', 'docs/strategy/onboarding.md'),
    ('docs/strategy/00_STRATEGY_FRENLY_AI_FUTURE.md', 'docs/strategy/ai-roadmap.md'),
    ('docs/strategy/00_STRATEGY_DIAGNOSIS.md', 'docs/strategy/legacy-diagnosis.md'),
]

for src, dest in moves:
    if os.path.exists(src):
        shutil.copy(src, dest)
    else:
        print(f"Warning: {src} missing")

print("Consolidation complete. Please verify before deleting old files.")

