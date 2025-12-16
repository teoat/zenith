# Legal RAG Plugins

This directory structure supports the Phase 6 Localization & Legal RAG (Retrieval Augmented Generation) Framework.

## Structure

```text
plugins/legal/
├── indonesia/     # Indonesian Jurisdiction
│   ├── laws/      # KUHP, UU Tipikor, etc.
│   ├── ethics/    # Kode Etik Hakim
│   ├── guidance/  # Jaksa Agung Guidelines
│   └── glossary.json
├── malaysia/      # Malaysian Jurisdiction
│   ├── laws/
│   └── ...
├── singapore/     # Singaporean Jurisdiction
│   ├── laws/
│   └── ...
└── shared/        # International Standards
    ├── fatf/      # FATF Recommendations
    └── basel/     # Basel III Compliance
```

## Integration

The AI Service (`services/ai_service.py`) will query these directories using LlamaIndex or simple vector similarity search to provide context-aware legal annotations for fraud findings.

## Status

**Phase:** Phase 6 (Planning/Initial Setup)
**Next Steps:**
- Populate `laws/` with PDF/Text content.
- Implement `LegalRAGService` to index and retrieve content.
