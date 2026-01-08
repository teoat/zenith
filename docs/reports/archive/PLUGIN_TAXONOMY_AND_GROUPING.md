# Plugin Taxonomy and Grouping Strategy

## Document Information
- **Document ID**: TAX-Zenith-PLUGIN-001
- **Version**: 1.0
- **Created**: December 17, 2025
- **Purpose**: Define logical plugin grouping, namespacing, and organizational structure
- **Related Documents**: 
  - [PLUGIN_ARCHITECTURE_RECOMMENDATIONS.md](./PLUGIN_ARCHITECTURE_RECOMMENDATIONS.md)
  - [PLUGIN_ARCHITECTURE_MIGRATION_PLAN.md](./PLUGIN_ARCHITECTURE_MIGRATION_PLAN.md)

---

## Table of Contents
1. [Plugin Taxonomy Overview](#1-plugin-taxonomy-overview)
2. [Primary Domain Groups](#2-primary-domain-groups)
3. [Namespace Structure](#3-namespace-structure)
4. [Security Boundary Groups](#4-security-boundary-groups)
5. [Marketplace Categories](#5-marketplace-categories)
6. [Deployment Groups](#6-deployment-groups)
7. [Implementation Guide](#7-implementation-guide)

---

## 1. Plugin Taxonomy Overview

### Hierarchical Structure

```
Zenith Plugin Ecosystem
│
├── DOMAIN LAYER (What it does)
│   ├── Detection
│   ├── Intelligence
│   ├── Integration
│   ├── Presentation
│   ├── Workflow
│   └── Infrastructure
│
├── TRUST LAYER (Who provides it)
│   ├── Core (Zenith official)
│   ├── Verified (Vetted third-party)
│   ├── Community (Public contributions)
│   └── Custom (Private/tenant-specific)
│
├── SCOPE LAYER (Where it runs)
│   ├── Global (All tenants)
│   ├── Tenant-specific (Multi-tenant)
│   ├── Environment-specific (Dev/Prod)
│   └── User-specific (Personal plugins)
│
└── LIFECYCLE LAYER (When to load)
    ├── Bootstrap (System startup)
    ├── On-demand (Lazy load)
    ├── Scheduled (Cron-based)
    └── Event-driven (Triggered)
```

### Grouping Principles

1. **Domain-Driven**: Group by business capability
2. **Bounded Contexts**: Clear separation of concerns
3. **Security Isolation**: Different trust levels
4. **Resource Management**: Group by resource requirements
5. **Dependency Management**: Minimize cross-group dependencies
6. **Discoverability**: Easy to find and understand

---

## 2. Primary Domain Groups

### Group 1: Detection Engines 🔍
**Purpose**: Identify fraud, threats, anomalies, and suspicious patterns

#### Subgroups

##### 1.1 Fraud Detection
```
plugins/detection/fraud/
├── pattern_based/              # Rule-based pattern matching
│   ├── mirror_transaction/     # Mirror transaction detection
│   ├── round_trip/             # Round-trip patterns
│   ├── structuring/            # Transaction structuring
│   ├── shell_company/          # Shell company identification
│   └── velocity_checking/      # Transaction velocity
│
├── behavior_based/             # Behavioral analysis
│   ├── insider_threat/         # Insider threat detection
│   ├── behavioral_biometrics/  # User behavior profiling
│   ├── session_anomaly/        # Session pattern analysis
│   └── account_takeover/       # ATO detection
│
├── ai_powered/                 # Machine learning models
│   ├── ai_detection/           # General AI fraud detector
│   ├── multimodal_fraud/       # Multi-source analysis
│   ├── predictive_alerting/    # Predictive ML
│   ├── explainable_ai/         # Interpretable ML
│   └── ensemble_detector/      # Combined ML models
│
├── specialized/                # Domain-specific detectors
│   ├── crypto_fraud/           # Cryptocurrency fraud
│   ├── api_abuse/              # API abuse detection
│   ├── payment_fraud/          # Payment-specific
│   ├── identity_fraud/         # Identity theft
│   └── chargeback_fraud/       # Chargeback analysis
│
└── temporal/                   # Time-based patterns
    ├── temporal_burst/         # Burst detection
    ├── time_series_anomaly/    # Time series analysis
    └── seasonal_patterns/      # Seasonal fraud patterns
```

**Plugin Count**: 25+
**Dependencies**: Shared ML models, feature extractors
**Security Level**: High (read transactions, write cases)
**Resource Requirements**: CPU-intensive, GPU optional

##### 1.2 Risk Assessment
```
plugins/detection/risk/
├── scoring_engines/
│   ├── advanced_risk_scoring/  # Comprehensive risk scores
│   ├── credit_risk/            # Credit risk analysis
│   ├── transaction_risk/       # Transaction scoring
│   └── entity_risk/            # Entity risk profiles
│
├── compliance_checks/
│   ├── sanctions_screening/    # OFAC, UN sanctions
│   ├── pep_screening/          # Politically Exposed Persons
│   ├── adverse_media/          # Negative news screening
│   └── kyc_verification/       # KYC/AML checks
│
└── reputation_analysis/
    ├── merchant_reputation/    # Merchant scoring
    ├── ip_reputation/          # IP address reputation
    └── device_fingerprint/     # Device reputation
```

**Plugin Count**: 12+
**Dependencies**: External data feeds, reputation databases

---

### Group 2: Intelligence & AI 🧠
**Purpose**: Advanced analytics, ML, insights, and cognitive capabilities

#### Subgroups

##### 2.1 AI Core Services
```
plugins/intelligence/ai_core/
├── nlp_engines/
│   ├── text_analysis/          # Document analysis
│   ├── sentiment_analyzer/     # Sentiment detection
│   ├── entity_extraction/      # NER (Named Entity Recognition)
│   ├── semantic_search/        # Vector-based search
│   └── translation/            # Multi-language support
│
├── vision_engines/
│   ├── document_ocr/           # Document text extraction
│   ├── image_classification/   # Image categorization
│   ├── face_recognition/       # Biometric identification
│   ├── logo_detection/         # Brand/logo identification
│   └── scene_understanding/    # Visual scene analysis
│
├── audio_engines/
│   ├── speech_to_text/         # Voice transcription
│   ├── voice_biometrics/       # Voice authentication
│   └── audio_anomaly/          # Audio fraud detection
│
└── multimodal/
    ├── multimodal_fusion/      # Cross-modal analysis
    ├── cross_reference/        # Data correlation
    └── context_builder/        # Contextual understanding
```

**Plugin Count**: 15+
**Resource Requirements**: GPU-heavy, high memory

##### 2.2 Analytics & Insights
```
plugins/intelligence/analytics/
├── descriptive/
│   ├── statistical_analysis/   # Stats, distributions
│   ├── cohort_analysis/        # Cohort tracking
│   └── funnel_analysis/        # Conversion funnels
│
├── diagnostic/
│   ├── root_cause_analysis/    # Why events occurred
│   ├── correlation_engine/     # Pattern correlations
│   └── impact_analysis/        # Impact assessment
│
├── predictive/
│   ├── forecasting/            # Time series forecasting
│   ├── churn_prediction/       # Customer churn
│   └── demand_prediction/      # Volume forecasting
│
└── prescriptive/
    ├── recommendation_engine/  # Action recommendations
    ├── optimization_engine/    # Resource optimization
    └── simulation_engine/      # What-if scenarios
```

**Plugin Count**: 12+

##### 2.3 Knowledge & Learning
```
plugins/intelligence/knowledge/
├── graph_engines/
│   ├── knowledge_graph/        # Entity relationships
│   ├── network_analysis/       # Social network analysis
│   └── link_prediction/        # Relationship prediction
│
├── learning_systems/
│   ├── online_learning/        # Continuous learning
│   ├── federated_learning/     # Privacy-preserving ML
│   ├── transfer_learning/      # Model adaptation
│   └── active_learning/        # Smart data labeling
│
└── memory_systems/
    ├── vector_store/           # Embeddings storage
    ├── document_index/         # RAG document index
    └── case_memory/            # Historical case patterns
```

**Plugin Count**: 10+

---

### Group 3: Integration & Connectors 🔌
**Purpose**: External system connectivity, data ingestion, and third-party services

#### Subgroups

##### 3.1 Payment Processors
```
plugins/integration/payments/
├── card_processors/
│   ├── stripe/                 # Stripe integration
│   ├── square/                 # Square integration
│   ├── adyen/                  # Adyen integration
│   └── braintree/              # Braintree integration
│
├── bank_connections/
│   ├── plaid/                  # Plaid banking API
│   ├── open_banking/           # Open Banking (EU)
│   ├── ach_processor/          # ACH payments
│   └── wire_transfer/          # Wire transfers
│
├── digital_wallets/
│   ├── paypal/                 # PayPal integration
│   ├── apple_pay/              # Apple Pay
│   ├── google_pay/             # Google Pay
│   └── venmo/                  # Venmo integration
│
└── crypto_gateways/
    ├── coinbase_commerce/      # Coinbase integration
    ├── bitpay/                 # BitPay gateway
    └── blockchain_monitor/     # On-chain monitoring
```

**Plugin Count**: 16+
**Security Level**: Critical (handles financial data)

##### 3.2 Data Sources
```
plugins/integration/data_sources/
├── databases/
│   ├── postgresql_connector/  # PostgreSQL external DBs
│   ├── mongodb_connector/     # MongoDB connections
│   ├── mysql_connector/       # MySQL connections
│   └── redis_connector/       # Redis data sources
│
├── data_warehouses/
│   ├── snowflake/              # Snowflake connector
│   ├── bigquery/               # Google BigQuery
│   ├── redshift/               # AWS Redshift
│   └── databricks/             # Databricks connector
│
├── apis/
│   ├── rest_api_client/        # Generic REST client
│   ├── graphql_client/         # GraphQL client
│   ├── soap_client/            # Legacy SOAP
│   └── webhook_receiver/       # Inbound webhooks
│
└── files/
    ├── csv_importer/           # CSV file processor
    ├── excel_importer/         # Excel processor
    ├── pdf_processor/          # PDF extraction
    └── json_importer/          # JSON data loader
```

**Plugin Count**: 16+

##### 3.3 External Services
```
plugins/integration/external_services/
├── identity_verification/
│   ├── jumio/                  # Jumio ID verification
│   ├── onfido/                 # Onfido KYC
│   ├── trulioo/                # Trulioo global identity
│   └── socure/                 # Socure fraud detection
│
├── credit_bureaus/
│   ├── experian/               # Experian credit
│   ├── equifax/                # Equifax integration
│   └── transunion/             # TransUnion data
│
├── fraud_intelligence/
│   ├── emailage/               # Email intelligence
│   ├── sift_science/           # Sift fraud network
│   ├── accertify/              # Accertify data
│   └── threatmetrix/           # ThreatMetrix device ID
│
├── geolocation/
│   ├── google_maps/            # Google Maps API
│   ├── mapbox/                 # Mapbox geocoding
│   ├── here_maps/              # HERE Technologies
│   └── maxmind/                # MaxMind GeoIP
│
└── regulatory/
    ├── refinitiv/              # Refinitiv compliance data
    ├── dow_jones/              # Dow Jones watchlist
    └── lexisnexis/             # LexisNexis risk data
```

**Plugin Count**: 16+

##### 3.4 Communication Channels
```
plugins/integration/communications/
├── email/
│   ├── sendgrid/               # SendGrid SMTP
│   ├── amazon_ses/             # Amazon SES
│   ├── mailgun/                # Mailgun service
│   └── smtp_generic/           # Generic SMTP
│
├── sms/
│   ├── twilio/                 # Twilio SMS
│   ├── amazon_sns/             # Amazon SNS
│   ├── messagebird/            # MessageBird
│   └── plivo/                  # Plivo SMS
│
├── push_notifications/
│   ├── firebase_cloud_messaging/ # FCM
│   ├── apple_push/             # APNs
│   └── onesignal/              # OneSignal
│
└── collaboration/
    ├── slack/                  # Slack integration
    ├── microsoft_teams/        # MS Teams
    ├── discord/                # Discord webhooks
    └── pagerduty/              # PagerDuty alerts
```

**Plugin Count**: 15+

---

### Group 4: Presentation & UI 🎨
**Purpose**: User interface components, visualizations, and dashboards

#### Subgroups

##### 4.1 Dashboard Widgets
```
plugins/presentation/dashboard_widgets/
├── metrics/
│   ├── kpi_card/               # Key metric display
│   ├── gauge_widget/           # Gauge visualization
│   ├── progress_indicator/     # Progress bars
│   └── counter_widget/         # Animated counters
│
├── charts/
│   ├── line_chart/             # Line/area charts
│   ├── bar_chart/              # Bar/column charts
│   ├── pie_chart/              # Pie/donut charts
│   ├── scatter_plot/           # Scatter plots
│   ├── heatmap/                # Heat map visualization
│   └── candlestick/            # Financial charts
│
├── tables/
│   ├── data_grid/              # Advanced data tables
│   ├── pivot_table/            # Pivot tables
│   └── summary_table/          # Summary displays
│
└── specialized/
    ├── alert_panel/            # Alert summaries
    ├── activity_feed/          # Recent activity
    ├── leaderboard/            # Top performers
    └── status_board/           # System status
```

**Plugin Count**: 18+
**Technology**: React components, Web Components

##### 4.2 Advanced Visualizations
```
plugins/presentation/visualizations/
├── graphs/
│   ├── network_graph_2d/       # 2D network visualization
│   ├── network_graph_3d/       # 3D entity graphs
│   ├── hierarchical_tree/      # Tree diagrams
│   ├── sankey_diagram/         # Flow diagrams
│   └── chord_diagram/          # Relationship circles
│
├── geospatial/
│   ├── map_widget/             # Interactive maps
│   ├── choropleth/             # Geographic heat maps
│   ├── cluster_map/            # Point clustering
│   └── route_visualization/    # Path tracking
│
├── temporal/
│   ├── timeline_view/          # Event timelines
│   ├── gantt_chart/            # Project timelines
│   └── calendar_heatmap/       # Calendar visualization
│
└── specialized/
    ├── fraud_pattern_viz/      # Fraud pattern displays
    ├── risk_matrix/            # Risk heat maps
    └── investigation_board/    # Case investigation UI
```

**Plugin Count**: 15+

##### 4.3 Forms & Inputs
```
plugins/presentation/forms/
├── input_components/
│   ├── smart_autocomplete/     # AI-powered autocomplete
│   ├── file_uploader/          # File upload with preview
│   ├── rich_text_editor/       # WYSIWYG editor
│   └── date_range_picker/      # Advanced date selection
│
├── validation/
│   ├── field_validator/        # Custom validation rules
│   ├── cross_field_validator/  # Inter-field validation
│   └── async_validator/        # Server-side validation
│
└── builders/
    ├── form_builder/           # Dynamic form generator
    ├── query_builder/          # Visual query builder
    └── rule_builder/           # No-code rule composer
```

**Plugin Count**: 10+

---

### Group 5: Workflow & Orchestration ⚙️
**Purpose**: Business process automation, case management, and workflow engines

#### Subgroups

##### 5.1 Case Management
```
plugins/workflow/case_management/
├── assignment/
│   ├── ai_case_routing/        # ML-based assignment
│   ├── round_robin/            # Round-robin distribution
│   ├── skill_based_routing/    # Route by expertise
│   └── workload_balancing/     # Load balancing
│
├── lifecycle/
│   ├── case_state_machine/     # State transitions
│   ├── auto_escalation/        # Automatic escalation
│   ├── sla_management/         # SLA tracking
│   └── case_merging/           # Duplicate case handling
│
└── resolution/
    ├── auto_resolution/        # Automatic closure
    ├── bulk_actions/           # Batch processing
    └── case_templates/         # Template-based cases
```

**Plugin Count**: 11+

##### 5.2 Approval Workflows
```
plugins/workflow/approvals/
├── chains/
│   ├── sequential_approval/    # Linear approval chain
│   ├── parallel_approval/      # Concurrent approvals
│   ├── conditional_approval/   # Rule-based routing
│   └── escalation_chain/       # Escalation paths
│
├── policies/
│   ├── approval_matrix/        # Role-based approvals
│   ├── threshold_rules/        # Amount-based routing
│   └── delegation_engine/      # Approval delegation
│
└── tracking/
    ├── approval_audit/         # Approval history
    └── sla_tracker/            # Approval SLAs
```

**Plugin Count**: 9+

##### 5.3 Investigation Workflows
```
plugins/workflow/investigation/
├── playbooks/
│   ├── fraud_investigation/    # Fraud playbooks
│   ├── compliance_review/      # Compliance workflows
│   ├── aml_investigation/      # AML procedures
│   └── chargeback_defense/     # Chargeback handling
│
├── evidence/
│   ├── evidence_collector/     # Evidence gathering
│   ├── chain_of_custody/       # Evidence tracking
│   └── evidence_validator/     # Evidence verification
│
└── collaboration/
    ├── team_coordination/      # Multi-investigator
    ├── task_management/        # Investigation tasks
    └── note_sharing/           # Shared annotations
```

**Plugin Count**: 10+

##### 5.4 Automation Rules
```
plugins/workflow/automation/
├── triggers/
│   ├── event_triggers/         # Event-based automation
│   ├── schedule_triggers/      # Cron-based jobs
│   └── webhook_triggers/       # External triggers
│
├── actions/
│   ├── notification_actions/   # Send notifications
│   ├── case_actions/           # Case operations
│   ├── api_actions/            # External API calls
│   └── data_actions/           # Data transformations
│
└── conditions/
    ├── rule_evaluator/         # Condition evaluation
    └── expression_engine/      # Complex expressions
```

**Plugin Count**: 9+

---

### Group 6: Infrastructure & Operations 🏗️
**Purpose**: System operations, monitoring, storage, and platform services

#### Subgroups

##### 6.1 Storage & Persistence
```
plugins/infrastructure/storage/
├── object_storage/
│   ├── aws_s3/                 # Amazon S3
│   ├── azure_blob/             # Azure Blob Storage
│   ├── google_cloud_storage/   # GCS
│   └── minio/                  # Self-hosted S3
│
├── cache/
│   ├── redis_cache/            # Redis caching
│   ├── memcached/              # Memcached
│   └── local_cache/            # In-memory cache
│
├── specialized/
│   ├── vector_database/        # Embeddings storage
│   │   ├── pinecone/           # Pinecone
│   │   ├── weaviate/           # Weaviate
│   │   └── qdrant/             # Qdrant
│   │
│   ├── time_series/            # Time series DBs
│   │   ├── influxdb/           # InfluxDB
│   │   └── timescaledb/        # TimescaleDB
│   │
│   └── document_store/         # Document databases
│       ├── elasticsearch/      # Elasticsearch
│       └── opensearch/         # OpenSearch
```

**Plugin Count**: 14+

##### 6.2 Observability
```
plugins/infrastructure/observability/
├── metrics/
│   ├── prometheus_exporter/    # Prometheus metrics
│   ├── datadog_exporter/       # Datadog integration
│   ├── new_relic_exporter/     # New Relic APM
│   └── custom_metrics/         # Custom metric collectors
│
├── logging/
│   ├── elk_shipper/            # ELK Stack
│   ├── splunk_forwarder/       # Splunk integration
│   ├── cloudwatch_logs/        # AWS CloudWatch
│   └── structured_logger/      # Structured logging
│
├── tracing/
│   ├── jaeger_tracer/          # Jaeger
│   ├── zipkin_tracer/          # Zipkin
│   └── opentelemetry/          # OpenTelemetry
│
└── alerting/
    ├── alert_manager/          # Alert routing
    ├── opsgenie/               # Opsgenie integration
    └── victorops/              # VictorOps (Splunk)
```

**Plugin Count**: 13+

##### 6.3 Security & Compliance
```
plugins/infrastructure/security/
├── authentication/
│   ├── oauth_provider/         # OAuth 2.0
│   ├── saml_provider/          # SAML SSO
│   ├── ldap_connector/         # LDAP/AD
│   └── webauthn_provider/      # WebAuthn/FIDO2
│
├── encryption/
│   ├── field_encryption/       # Field-level encryption
│   ├── kms_integration/        # AWS KMS, Azure Key Vault
│   └── pgp_handler/            # PGP encryption
│
├── audit/
│   ├── audit_logger/           # Comprehensive auditing
│   ├── compliance_reporter/    # Compliance reports
│   └── gdpr_handler/           # GDPR right-to-forget
│
└── scanning/
    ├── vulnerability_scanner/  # Security scanning
    ├── dependency_checker/     # Dependency audits
    └── license_validator/      # License compliance
```

**Plugin Count**: 13+

##### 6.4 DevOps & Platform
```
plugins/infrastructure/devops/
├── deployment/
│   ├── blue_green_deployer/    # Blue-green deployments
│   ├── canary_deployer/        # Canary releases
│   └── feature_flags/          # Feature flag system
│
├── health/
│   ├── health_checker/         # Health endpoints
│   ├── readiness_probe/        # Readiness checks
│   └── liveness_probe/         # Liveness checks
│
└── optimization/
    ├── cache_warmer/           # Cache pre-loading
    ├── query_optimizer/        # Query optimization
    └── resource_scaler/        # Auto-scaling
```

**Plugin Count**: 9+

---

### Group 7: Compliance & Regulatory 📋
**Purpose**: Regulatory compliance, reporting, and governance

```
plugins/compliance/regulations/
├── financial/
│   ├── fatf_compliance/        # Financial Action Task Force
│   ├── bsa_aml/                # Bank Secrecy Act / AML
│   ├── usa_patriot_act/        # USA PATRIOT Act
│   ├── dodd_frank/             # Dodd-Frank Act
│   └── sox_compliance/         # Sarbanes-Oxley
│
├── privacy/
│   ├── gdpr/                   # EU GDPR
│   ├── ccpa/                   # California CCPA
│   ├── pipeda/                 # Canadian privacy
│   ├── lgpd/                   # Brazilian LGPD
│   └── privacy_shield/         # EU-US Privacy Shield
│
├── payments/
│   ├── pci_dss/                # PCI DSS compliance
│   ├── psd2/                   # EU PSD2
│   └── ach_rules/              # ACH regulations
│
├── regional/
│   ├── mifid_ii/               # EU MiFID II
│   ├── emir/                   # EU EMIR
│   ├── fca_uk/                 # UK FCA rules
│   └── finra/                  # US FINRA
│
└── reporting/
    ├── sar_generator/          # Suspicious Activity Reports
    ├── ctr_generator/          # Currency Transaction Reports
    ├── regulatory_filings/     # Automated filings
    └── audit_reports/          # Compliance audits
```

**Plugin Count**: 20+
**Security Level**: Critical (regulatory data)

---

## 3. Namespace Structure

### Naming Convention

```
{publisher}/{domain}/{category}/{plugin_name}
```

**Examples**:
```
Zenith/detection/fraud/crypto_fraud_detector
Zenith/intelligence/ai_core/semantic_search
Zenith/integration/payments/stripe
Zenith/presentation/dashboard_widgets/kpi_card
Zenith/workflow/case_management/ai_case_routing
Zenith/infrastructure/storage/aws_s3
Zenith/compliance/privacy/gdpr

verified/acme-corp/detection/fraud/custom_ml_detector
community/john-doe/presentation/visualizations/custom_graph
custom/tenant-123/workflow/approvals/custom_approval_chain
```

### Directory Structure

```
plugins/
├── Zenith/                    # Official plugins
│   ├── detection/
│   │   ├── fraud/
│   │   │   ├── crypto_fraud_detector/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── plugin.py
│   │   │   │   ├── metadata.json
│   │   │   │   ├── requirements.txt
│   │   │   │   ├── README.md
│   │   │   │   ├── tests/
│   │   │   │   └── config.schema.json
│   │   │   └── ...
│   │   └── risk/
│   ├── intelligence/
│   ├── integration/
│   ├── presentation/
│   ├── workflow/
│   ├── infrastructure/
│   └── compliance/
│
├── verified/                   # Verified third-party
│   ├── acme-corp/
│   ├── fraud-insights-inc/
│   └── ...
│
├── community/                  # Community contributions
│   └── {github-username}/
│
└── custom/                     # Customer-specific
    └── {tenant-id}/
```

### Metadata Schema

```json
{
  "namespace": "Zenith/detection/fraud/crypto_fraud_detector",
  "plugin_id": "crypto_fraud_detector",
  "version": "1.2.3",
  "domain": "detection",
  "category": "fraud",
  "subcategory": "specialized",
  "publisher": {
    "name": "Zenith",
    "type": "official|verified|community|custom",
    "contact": "plugins@Zenith.com"
  },
  "display": {
    "name": "Cryptocurrency Fraud Detector",
    "description": "Detects fraud in cryptocurrency transactions",
    "icon": "plugins/icons/crypto_fraud.svg",
    "tags": ["fraud", "crypto", "blockchain", "detection"]
  },
  "technical": {
    "api_version": "v1",
    "runtime": "python:3.11",
    "entry_point": "plugin:CryptoFraudDetector",
    "dependencies": {
      "Zenith/intelligence/ai_core/ml_framework": ">=2.0.0",
      "numpy": ">=1.24.0",
      "pandas": ">=2.0.0"
    }
  },
  "permissions": [
    "read:transactions",
    "write:cases",
    "read:blockchain_data"
  ],
  "resource_limits": {
    "max_memory_mb": 512,
    "max_cpu_percent": 10,
    "max_execution_ms": 100
  },
  "security": {
    "signature": "BASE64_PGP_SIGNATURE",
    "checksum": "SHA256_HASH",
    "trust_level": "official"
  }
}
```

---

## 4. Security Boundary Groups

### Trust Levels

#### Level 1: Core Plugins (Highest Trust)
- **Publisher**: Zenith official
- **Access**: Full system access
- **Sandboxing**: None (runs in main process)
- **Review**: Internal QA only
- **Examples**: Core fraud detectors, critical workflows

**Domains**:
- `Zenith/detection/fraud/*` (core detectors)
- `Zenith/infrastructure/security/*`
- `Zenith/compliance/*`

#### Level 2: Verified Plugins (High Trust)
- **Publisher**: Vetted third-parties
- **Access**: Limited system access
- **Sandboxing**: Process isolation
- **Review**: Security audit required
- **Examples**: Premium integrations, certified solutions

**Domains**:
- `verified/*/integration/payments/*`
- `verified/*/detection/fraud/*`

#### Level 3: Community Plugins (Medium Trust)
- **Publisher**: Public contributions
- **Access**: Restricted permissions
- **Sandboxing**: Strict isolation
- **Review**: Automated security scanning
- **Examples**: Custom visualizations, utilities

**Domains**:
- `community/*/presentation/visualizations/*`
- `community/*/workflow/*`

#### Level 4: Custom Plugins (Variable Trust)
- **Publisher**: Customer-specific
- **Access**: Tenant-isolated
- **Sandboxing**: Tenant sandbox
- **Review**: Customer responsibility
- **Examples**: Internal tools, proprietary logic

**Domains**:
- `custom/{tenant-id}/*`

### Permission Groups

```python
PERMISSION_GROUPS = {
    'read_only': [
        'read:transactions',
        'read:cases',
        'read:users',
        'read:analytics'
    ],
    
    'fraud_detection': [
        'read:transactions',
        'read:entities',
        'write:cases',
        'write:alerts'
    ],
    
    'case_management': [
        'read:cases',
        'write:cases',
        'read:evidence',
        'write:evidence',
        'read:users'
    ],
    
    'integration': [
        'external:api_calls',
        'read:configuration',
        'write:webhooks'
    ],
    
    'ui_component': [
        'render:html',
        'read:user_session',
        'read:preferences'
    ],
    
    'admin': [
        'system:configuration',
        'user:management',
        'plugin:management'
    ]
}
```

---

## 5. Marketplace Categories

### User-Facing Categories

```
Marketplace
├── 🔍 Fraud Detection (45 plugins)
│   ├── ⭐ Popular
│   ├── 🆕 New Arrivals
│   ├── 💎 Premium
│   ├── Pattern-Based Detection (8)
│   ├── AI/ML Detection (12)
│   ├── Behavioral Analysis (6)
│   ├── Crypto & Blockchain (5)
│   └── Specialized Detectors (14)
│
├── 🧠 Intelligence & AI (32 plugins)
│   ├── Natural Language Processing (7)
│   ├── Computer Vision (5)
│   ├── Machine Learning Models (8)
│   ├── Analytics & Insights (12)
│
├── 🔌 Integrations (47 plugins)
│   ├── Payment Processors (16)
│   ├── Data Sources (12)
│   ├── Identity Verification (8)
│   ├── Communications (11)
│
├── 🎨 Dashboard & UI (33 plugins)
│   ├── Charts & Graphs (11)
│   ├── Widgets (12)
│   ├── Visualizations (10)
│
├── ⚙️ Workflows (30 plugins)
│   ├── Case Management (11)
│   ├── Approvals (9)
│   ├── Investigation (10)
│
├── 🏗️ Infrastructure (36 plugins)
│   ├── Storage (14)
│   ├── Monitoring (13)
│   ├── Security (9)
│
├── 📋 Compliance (20 plugins)
│   ├── Financial Regulations (8)
│   ├── Privacy Laws (6)
│   ├── Reporting (6)
│
└── 🛠️ Utilities (12 plugins)
    ├── Data Transformers
    ├── Validators
    └── Helpers
```

### Filtering & Discovery

**Filter Options**:
- **By Publisher**: Official, Verified, Community, Custom
- **By Price**: Free, Premium, Enterprise
- **By Rating**: 5★, 4★+, 3★+
- **By Popularity**: Most Downloaded, Trending, New
- **By Industry**: Finance, Healthcare, Retail, etc.
- **By Compliance**: GDPR, PCI-DSS, SOX, etc.

**Search Tags**:
```
#fraud #ai #ml #payments #crypto #dashboard #workflow 
#compliance #gdpr #integration #analytics #visualization 
#case-management #reporting #audit #security #monitoring
```

---

## 6. Deployment Groups

### By Lifecycle

#### Bootstrap Plugins
**Loaded at**: System startup
**Purpose**: Critical system functionality

```
deployment/bootstrap/
├── Zenith/infrastructure/security/auth_provider
├── Zenith/infrastructure/storage/database_connector
├── Zenith/infrastructure/observability/metrics_exporter
└── Zenith/compliance/privacy/gdpr
```

#### On-Demand Plugins
**Loaded at**: First use (lazy loading)
**Purpose**: Optional, heavy plugins

```
deployment/on_demand/
├── Zenith/intelligence/ai_core/* (GPU-heavy)
├── Zenith/presentation/visualizations/* (rarely used)
└── verified/*/integration/* (external APIs)
```

#### Scheduled Plugins
**Loaded at**: Specific times (cron)
**Purpose**: Batch processing, reporting

```
deployment/scheduled/
├── Zenith/compliance/reporting/sar_generator (daily)
├── Zenith/workflow/automation/cleanup_jobs (nightly)
└── Zenith/intelligence/analytics/batch_analytics (hourly)
```

#### Event-Driven Plugins
**Loaded at**: Specific events
**Purpose**: Reactive processing

```
deployment/event_driven/
├── Zenith/workflow/case_management/auto_escalation (case:priority_high)
├── Zenith/integration/communications/slack (alert:critical)
└── Zenith/detection/fraud/temporal_burst (transaction:spike)
```

### By Environment

```yaml
environments:
  development:
    plugins:
      - Zenith/detection/fraud/* (all)
      - Zenith/infrastructure/observability/debug_logger
      - community/* (allow all)
  
  staging:
    plugins:
      - Zenith/detection/fraud/* (all)
      - verified/* (verified only)
      - custom/{tenant-id}/* (beta testing)
  
  production:
    plugins:
      - Zenith/detection/fraud/* (approved list)
      - Zenith/intelligence/ai_core/* (stable versions)
      - verified/* (security scanned)
      - custom/{tenant-id}/* (reviewed)
```

### By Tenant

```yaml
tenants:
  tenant-global-bank:
    plugins:
      - Zenith/compliance/financial/fatf_compliance
      - Zenith/compliance/financial/bsa_aml
      - Zenith/detection/fraud/wire_fraud_detector
      - custom/tenant-global-bank/approval_matrix
  
  tenant-crypto-exchange:
    plugins:
      - Zenith/detection/fraud/crypto_fraud_detector
      - Zenith/integration/crypto_gateways/*
      - verified/chainalysis/on_chain_monitoring
      - custom/tenant-crypto-exchange/whale_alert
  
  tenant-ecommerce:
    plugins:
      - Zenith/detection/fraud/chargeback_detector
      - Zenith/integration/payments/stripe
      - Zenith/integration/payments/paypal
      - custom/tenant-ecommerce/loyalty_fraud_detector
```

---

## 7. Implementation Guide

### Plugin Registration

```python
# plugins/Zenith/detection/fraud/crypto_fraud_detector/__init__.py
from core.plugin_system import register_plugin
from .plugin import CryptoFraudDetector

# Auto-registration when imported
register_plugin(
    namespace="Zenith/detection/fraud/crypto_fraud_detector",
    plugin_class=CryptoFraudDetector,
    metadata_path="./metadata.json"
)
```

### Plugin Discovery

```python
class PluginRegistry:
    def discover_plugins_by_group(self, domain: str, category: str = None):
        """
        Discover plugins by domain and optional category
        
        Examples:
            discover_plugins_by_group("detection")  # All detection plugins
            discover_plugins_by_group("detection", "fraud")  # Fraud detectors only
        """
        plugins = []
        
        # Search in namespace structure
        search_path = f"plugins/*/{domain}/"
        if category:
            search_path += f"{category}/"
        
        for plugin_dir in glob(search_path):
            metadata = self.load_metadata(plugin_dir)
            if self.validate_metadata(metadata):
                plugins.append(metadata)
        
        return plugins
    
    def get_plugins_by_trust_level(self, trust_level: str):
        """Get all plugins at a specific trust level"""
        publishers = {
            'official': ['Zenith'],
            'verified': self.get_verified_publishers(),
            'community': ['*'],
            'custom': ['custom/*']
        }
        
        return self.discover_by_publisher(publishers[trust_level])
```

### Dependency Resolution Example

```python
# Plugin A depends on Plugin B
# Plugin C depends on Plugin A and Plugin D

dependency_graph = {
    'Zenith/detection/fraud/advanced_ml_detector': [
        'Zenith/intelligence/ai_core/ml_framework>=2.0.0',
        'Zenith/infrastructure/storage/vector_database>=1.0.0'
    ],
    'Zenith/intelligence/ai_core/ml_framework': [
        'Zenith/infrastructure/storage/cache>=1.0.0'
    ],
    'Zenith/workflow/case_management/ai_routing': [
        'Zenith/detection/fraud/advanced_ml_detector>=1.5.0',
        'Zenith/intelligence/analytics/predictive>=1.0.0'
    ]
}

# Topological sort ensures correct load order:
load_order = [
    'Zenith/infrastructure/storage/cache',
    'Zenith/intelligence/ai_core/ml_framework',
    'Zenith/infrastructure/storage/vector_database',
    'Zenith/detection/fraud/advanced_ml_detector',
    'Zenith/intelligence/analytics/predictive',
    'Zenith/workflow/case_management/ai_routing'
]
```

### Multi-Version Support

```python
# Load multiple versions for gradual migration
plugin_registry.load(
    'Zenith/detection/fraud/crypto_detector',
    versions=['1.2.3', '2.0.0'],
    default='1.2.3',
    routing_strategy='feature_flag'  # or 'percentage', 'canary'
)

# Usage with feature flag
if feature_flags.get('USE_CRYPTO_DETECTOR_V2'):
    plugin = plugin_registry.get('Zenith/detection/fraud/crypto_detector', version='2.0.0')
else:
    plugin = plugin_registry.get('Zenith/detection/fraud/crypto_detector', version='1.2.3')
```

---

## 8. Marketing & Sales Grouping Strategies

### Solution Bundles 🎁

#### Bundle 1: Fraud Prevention Starter Pack
**Target**: Small to medium businesses starting fraud prevention
**Price**: $499/month

```
Bundle Contents (15 plugins):
├── Detection (Core)
│   ├── Zenith/detection/fraud/ai_detection
│   ├── Zenith/detection/fraud/velocity_checking
│   ├── Zenith/detection/fraud/pattern_matcher
│   └── Zenith/detection/risk/transaction_scoring
│
├── Presentation (Essentials)
│   ├── Zenith/presentation/dashboard_widgets/fraud_metrics
│   ├── Zenith/presentation/dashboard_widgets/alert_panel
│   └── Zenith/presentation/visualizations/timeline_view
│
├── Workflow (Basic)
│   ├── Zenith/workflow/case_management/manual_review_queue
│   └── Zenith/workflow/approvals/basic_approval_chain
│
└── Integration (Standard)
    ├── Zenith/integration/communications/email/sendgrid
    ├── Zenith/integration/payments/stripe
    └── Zenith/infrastructure/observability/basic_metrics

Features:
✅ Real-time fraud detection
✅ Configurable alert rules
✅ Basic case management
✅ Email notifications
✅ Standard dashboards
```

**Marketing Message**: *"Stop fraud before it starts - Get essential protection in minutes"*

#### Bundle 2: Enterprise Fraud Defense Suite
**Target**: Large enterprises with complex fraud scenarios
**Price**: $4,999/month

```
Bundle Contents (50+ plugins):
├── Detection (Advanced)
│   ├── All Fraud Detection plugins (25)
│   ├── All Risk Assessment plugins (12)
│   └── Behavioral Analysis plugins (6)
│
├── Intelligence (AI-Powered)
│   ├── ML-based detectors (8)
│   ├── Predictive analytics (5)
│   ├── Network analysis (4)
│   └── Advanced correlation (3)
│
├── Presentation (Premium)
│   ├── Custom dashboards (unlimited)
│   ├── All visualization plugins (15)
│   └── Executive reporting (5)
│
├── Workflow (Enterprise)
│   ├── Multi-tier approvals (all)
│   ├── SLA management (all)
│   └── Investigation playbooks (10)
│
└── Integration (Unlimited)
    ├── Premium connectors (all)
    ├── Custom API development
    └── White-glove onboarding

Features:
✅ AI/ML fraud prevention
✅ Multi-channel detection
✅ Advanced analytics
✅ Custom workflows
✅ Dedicated support
✅ SLA guarantees
```

**Marketing Message**: *"Military-grade fraud protection powered by AI"*

#### Bundle 3: Financial Compliance Pack
**Target**: Banks, fintechs, financial institutions
**Price**: $2,999/month

```
Bundle Contents (30 plugins):
├── Compliance (Regulatory)
│   ├── Zenith/compliance/financial/fatf_compliance
│   ├── Zenith/compliance/financial/bsa_aml
│   ├── Zenith/compliance/financial/kyc_verification
│   ├── Zenith/compliance/reporting/sar_generator
│   ├── Zenith/compliance/reporting/ctr_generator
│   └── Regional compliance plugins (10)
│
├── Detection (AML-Focused)
│   ├── Transaction monitoring
│   ├── Sanctions screening
│   ├── PEP screening
│   └── Adverse media monitoring
│
├── Workflow (Compliance)
│   ├── AML investigation playbooks
│   ├── Compliance case management
│   └── Regulatory reporting automation
│
└── Integration (Financial)
    ├── Core banking systems
    ├── Credit bureaus
    └── Regulatory filing systems

Features:
✅ FATF compliant
✅ Automated SAR/CTR filing
✅ Real-time sanctions screening
✅ Audit trail (10 years)
✅ Regulatory updates included
```

**Marketing Message**: *"Stay compliant, sleep well - Automated regulatory compliance"*

#### Bundle 4: Crypto Security Bundle
**Target**: Cryptocurrency exchanges, blockchain companies
**Price**: $3,499/month

```
Bundle Contents (20 plugins):
├── Detection (Crypto-Specific)
│   ├── Zenith/detection/fraud/crypto_fraud_detector
│   ├── On-chain transaction monitoring
│   ├── Wallet risk scoring
│   ├── Smart contract analysis
│   └── DeFi fraud detection
│
├── Integration (Blockchain)
│   ├── Bitcoin node connector
│   ├── Ethereum node connector
│   ├── Multi-chain monitoring
│   ├── verified/chainalysis/integration
│   └── verified/elliptic/screening
│
├── Compliance (Crypto)
│   ├── Travel Rule compliance
│   ├── VASP screening
│   └── Crypto tax reporting
│
└── Analytics (Blockchain)
    ├── Whale tracking
    ├── Mixer detection
    └── Cross-chain analysis

Features:
✅ Multi-blockchain support
✅ Real-time on-chain monitoring
✅ Mixer/tumbler detection
✅ Smart contract auditing
✅ Travel Rule automation
```

**Marketing Message**: *"Protect your crypto business from blockchain-based fraud"*

#### Bundle 5: E-commerce Protection Suite
**Target**: Online retailers, marketplaces
**Price**: $1,499/month

```
Bundle Contents (25 plugins):
├── Detection (E-commerce)
│   ├── Chargeback prevention
│   ├── Account takeover detection
│   ├── Promo abuse prevention
│   ├── Friendly fraud detection
│   └── Return fraud detection
│
├── Integration (Payments)
│   ├── Stripe, PayPal, Square (all major processors)
│   ├── Shipping carriers (FedEx, UPS, USPS)
│   └── E-commerce platforms (Shopify, WooCommerce)
│
├── Presentation (Merchant)
│   ├── Chargeback dashboards
│   ├── Order risk scoring
│   └── Customer lifetime value analytics
│
└── Workflow (Order Management)
    ├── High-risk order review
    ├── Automated refund handling
    └── Customer verification flows

Features:
✅ Chargeback reduction (up to 80%)
✅ Account takeover prevention
✅ Promo code protection
✅ Shipping fraud detection
✅ Friendly fraud mitigation
```

**Marketing Message**: *"Boost profits by stopping chargebacks and fraud"*

### Customer Segment Grouping 👥

#### Segment A: Small Business (1-50 employees)
**Needs**: Simple, affordable, easy to use

```yaml
recommended_plugins:
  - category: starter_bundles
  - count: 5-10 plugins
  - pricing: freemium + pay-per-use
  - deployment: cloud_only
  - support: self_service + community
  
plugin_focus:
  - Basic fraud detection
  - Email alerts
  - Simple dashboards
  - Payment processor integration (1-2)
  - DIY configuration
```

**Marketing Angle**: "Fraud protection for small businesses - Easy, affordable, effective"

#### Segment B: Mid-Market (50-500 employees)
**Needs**: Customizable, scalable, good support

```yaml
recommended_plugins:
  - category: professional_bundles
  - count: 20-30 plugins
  - pricing: subscription_tiers
  - deployment: cloud_or_hybrid
  - support: email + chat + phone
  
plugin_focus:
  - Advanced fraud rules
  - Custom workflows
  - Multi-channel detection
  - API integrations (5-10)
  - Training included
```

**Marketing Angle**: "Scale your fraud prevention as you grow"

#### Segment C: Enterprise (500+ employees)
**Needs**: White-glove service, customization, SLAs

```yaml
recommended_plugins:
  - category: enterprise_suite
  - count: 50-100+ plugins
  - pricing: custom_contract
  - deployment: on_premise_or_private_cloud
  - support: dedicated_team + SLA
  
plugin_focus:
  - All plugins available
  - Custom plugin development
  - Multi-tenant management
  - Advanced security
  - Compliance certifications
```

**Marketing Angle**: "Enterprise-grade fraud prevention with unlimited scalability"

#### Segment D: Technology Partners
**Needs**: API access, white-label, revenue share

```yaml
recommended_plugins:
  - category: partner_sdk
  - count: SDK + select plugins
  - pricing: revenue_share
  - deployment: embedded
  - support: partner_program
  
plugin_focus:
  - Embeddable widgets
  - API-first plugins
  - White-label options
  - Partner portal access
  - Co-marketing opportunities
```

**Marketing Angle**: "Build fraud prevention into your product"

### Industry Vertical Grouping 🏢

#### Vertical 1: Banking & Financial Services
```
Recommended Plugins (40):
├── Compliance: FATF, BSA/AML, KYC, SOX (8)
├── Detection: Wire fraud, Check fraud, Card fraud (10)
├── Integration: Core banking, Swift, ACH (6)
├── Reporting: Regulatory filings, Audit reports (8)
└── Analytics: Risk scoring, Credit analysis (8)

Marketing Materials:
- Case studies: Top banks using the platform
- Compliance certifications
- ROI calculators (fraud loss reduction)
- Regulatory update newsletter
```

#### Vertical 2: Cryptocurrency & Blockchain
```
Recommended Plugins (25):
├── Detection: On-chain fraud, Mixer detection (8)
├── Compliance: Travel Rule, VASP screening (5)
├── Integration: Bitcoin, Ethereum, Multi-chain (7)
└── Analytics: Whale tracking, Risk scoring (5)

Marketing Materials:
- Blockchain fraud statistics
- Crypto-specific case studies
- Integration with major exchanges
- Thought leadership (crypto security)
```

#### Vertical 3: E-commerce & Retail
```
Recommended Plugins (30):
├── Detection: Chargeback, Account takeover, Promo abuse (10)
├── Integration: Shopify, WooCommerce, Payment processors (8)
├── Analytics: Customer LTV, Fraud patterns (6)
└── Workflow: Order review, Refund automation (6)

Marketing Materials:
- Chargeback reduction case studies
- ROI from fraud prevention
- Integration marketplace
- Seasonal fraud trends report
```

#### Vertical 4: Healthcare & Insurance
```
Recommended Plugins (28):
├── Compliance: HIPAA, Privacy protection (6)
├── Detection: Insurance fraud, Identity theft (8)
├── Integration: EMR systems, Claims processors (6)
└── Analytics: Claims analysis, Fraud patterns (8)

Marketing Materials:
- Healthcare fraud statistics
- HIPAA compliance documentation
- Insurance industry case studies
- Privacy & security whitepaper
```

#### Vertical 5: Gaming & Gambling
```
Recommended Plugins (22):
├── Detection: Multi-accounting, Bonus abuse, Collusion (8)
├── Compliance: Gaming regulations, Age verification (4)
├── Integration: Payment processors, Game platforms (5)
└── Analytics: Player behavior, Risk profiling (5)

Marketing Materials:
- Gaming fraud playbook
- Responsible gaming compliance
- Player protection case studies
- Bonus abuse prevention guide
```

### Use Case Grouping 💼

#### Use Case 1: "Reduce Chargebacks by 80%"
**Target Pain Point**: High chargeback rates hurting profits

```
Solution Stack:
├── Core Plugin: Chargeback predictor (AI/ML)
├── Supporting: Transaction risk scoring
├── Supporting: 3DS integration
├── Supporting: Order verification workflow
├── Dashboard: Chargeback analytics
└── Integration: Payment processor data

ROI Metrics:
- Average chargeback reduction: 70-85%
- Payback period: 2-3 months
- Annual savings: $50K - $500K

Landing Page Elements:
✅ Chargeback calculator
✅ Before/after case study
✅ Free chargeback audit
✅ 30-day money-back guarantee
```

#### Use Case 2: "Stop Account Takeover (ATO)"
**Target Pain Point**: Customer accounts being compromised

```
Solution Stack:
├── Core Plugin: Behavioral biometrics
├── Supporting: Device fingerprinting
├── Supporting: Velocity checking
├── Supporting: Anomaly detection (ML)
├── Workflow: Step-up authentication
└── Alert: Real-time ATO alerts

ROI Metrics:
- ATO reduction: 90%+
- False positive rate: <1%
- Customer friction: Minimal

Landing Page Elements:
✅ ATO threat assessment
✅ Demo: behavioral biometrics
✅ Security certification badges
✅ Customer testimonials
```

#### Use Case 3: "Automate Compliance Reporting"
**Target Pain Point**: Manual regulatory reporting taking weeks

```
Solution Stack:
├── Core Plugin: SAR auto-generator
├── Supporting: Transaction monitoring
├── Supporting: Case management
├── Supporting: Audit trail
├── Integration: Regulatory filing systems
└── Dashboard: Compliance status

ROI Metrics:
- Time savings: 80% reduction
- Error reduction: 95%
- Audit readiness: 100%

Landing Page Elements:
✅ Compliance checklist
✅ Time-to-file comparison
✅ Audit success rate
✅ Free compliance assessment
```

#### Use Case 4: "Launch in New Market Fast"
**Target Pain Point**: Expanding to new geography with different regulations

```
Solution Stack:
├── Core Plugin: Regional compliance pack
├── Supporting: Localization plugins
├── Supporting: Regional payment methods
├── Supporting: Local data residency
├── Workflow: Country-specific rules
└── Integration: Local partners

ROI Metrics:
- Time to market: 3 months → 3 weeks
- Compliance risk: Minimized
- Local expertise: Built-in

Landing Page Elements:
✅ Country expansion checklist
✅ Regulatory comparison chart
✅ Success stories by region
✅ Partnership opportunities
```

### Pricing Tier Grouping 💰

#### Tier 1: Free (Freemium)
**Goal**: Acquisition, product-led growth

```
Included Plugins (5):
├── Zenith/detection/fraud/basic_pattern_matcher
├── Zenith/presentation/dashboard_widgets/basic_metrics
├── Zenith/workflow/case_management/manual_queue (100 cases/mo)
├── Zenith/integration/communications/email/smtp
└── Zenith/infrastructure/observability/basic_metrics

Limitations:
- 1,000 transactions/month
- 100 cases/month
- 1 user
- Community support only
- Zenith branding

Upgrade Triggers:
→ Transaction limit reached
→ Need for automation
→ Multi-user access
→ Priority support
```

**Marketing**: "Start free, upgrade when you grow"

#### Tier 2: Starter ($299/month)
**Goal**: SMB customers, quick wins

```
Included Plugins (15):
├── All Free tier plugins
├── 5 additional fraud detectors
├── 3 dashboard widgets
├── 2 workflow automations
├── 3 payment integrations
└── Email support

Limits:
- 10,000 transactions/month
- 500 cases/month
- 5 users
- Email support (24hr response)
- Remove branding

Upgrade Triggers:
→ Higher volume
→ Need ML/AI features
→ Custom workflows
→ API access
```

**Marketing**: "Professional fraud prevention at startup prices"

#### Tier 3: Professional ($999/month)
**Goal**: Mid-market companies, full features

```
Included Plugins (40):
├── All Starter plugins
├── ML/AI fraud detectors (10)
├── Advanced analytics (5)
├── Custom workflows (unlimited)
├── All integrations (20)
├── API access (100K calls/month)
└── Phone + email support

Limits:
- 100,000 transactions/month
- 2,000 cases/month
- 20 users
- Phone support (4hr response)
- Custom branding

Upgrade Triggers:
→ Enterprise volume
→ SLA requirements
→ Custom plugins
→ On-premise deployment
```

**Marketing**: "Everything you need to fight fraud at scale"

#### Tier 4: Enterprise (Custom)
**Goal**: Large enterprises, unlimited usage

```
Included Plugins (Unlimited):
├── All plugins (100+)
├── Custom plugin development (5/year)
├── Dedicated instance
├── White-label options
├── SSO/SAML integration
├── API access (unlimited)
├── Dedicated success manager
└── 24/7 phone support + Slack

Features:
- Unlimited transactions
- Unlimited cases
- Unlimited users
- 99.99% SLA
- On-premise option
- Custom contracts
- Legal review included

Add-ons:
→ Additional custom plugins
→ Professional services
→ Training programs
→ Co-development
```

**Marketing**: "Enterprise-grade fraud prevention, your way"

#### Tier 5: Partner/OEM (Revenue Share)
**Goal**: Technology partners embedding the platform

```
Included Plugins (SDK + Selected):
├── Embeddable SDK
├── White-label UI components (20)
├── API-first plugins (30)
├── Partner portal access
├── Co-marketing toolkit
└── Revenue share model (70/30)

Features:
- Unlimited end-user transactions
- Sub-tenant management
- Custom branding
- Dedicated partner manager
- Joint go-to-market
- MDF (Market Development Funds)

Requirements:
→ Minimum commitment (100 customers)
→ Technical integration review
→ Joint business plan
→ Quarterly business reviews
```

**Marketing**: "Power your product with our fraud prevention engine"

### Campaign-Based Grouping 📢

#### Campaign 1: "New Year Security Refresh"
**Timing**: January
**Offer**: 2 months free on annual contract

```
Featured Plugins:
├── Security audit plugins
├── Compliance update plugins
├── 2024 fraud trends detector
└── Year-end reporting tools

Landing Page:
- 2024 fraud statistics
- Free security assessment
- Migration guide (from competitors)
- Limited-time discount
```

#### Campaign 2: "Compliance Deadline Alert"
**Timing**: Q2 (regulatory deadlines)
**Offer**: Fast-track onboarding

```
Featured Plugins:
├── Specific regulation plugins (e.g., GDPR anniversary)
├── Audit preparation tools
├── Compliance reporting
└── Documentation generators

Landing Page:
- Countdown timer to deadline
- Compliance checklist
- Penalty calculator
- Emergency onboarding (2 weeks)
```

#### Campaign 3: "Holiday Shopping Protection"
**Timing**: October-December
**Offer**: Seasonal fraud prevention bundle

```
Featured Plugins:
├── High-volume transaction handling
├── Seasonal fraud patterns
├── Gift card fraud prevention
├── Return fraud detection
└── Chargeback surge protection

Landing Page:
- Holiday fraud statistics
- Volume capacity calculator
- Success stories from last season
- Seasonal pricing
```

#### Campaign 4: "Crypto Security Awareness"
**Timing**: Ongoing (crypto news cycle)
**Offer**: Crypto bundle trial

```
Featured Plugins:
├── Crypto fraud detectors
├── Blockchain monitoring
├── Wallet screening
└── DeFi security

Landing Page:
- Recent crypto fraud cases
- Free blockchain audit
- Crypto risk assessment
- Industry partnerships
```

---

## 9. Marketing Collateral Mapping

### Plugin → Marketing Asset Matrix

| Plugin Category | Website Section | Case Studies | Whitepapers | Videos | Demos |
|----------------|----------------|--------------|-------------|--------|-------|
| Fraud Detection | Product > Detection | ✅ 5 | ✅ 3 | ✅ | ✅ Live |
| AI/ML Intelligence | Product > AI | ✅ 3 | ✅ 2 | ✅ | ✅ Interactive |
| Compliance | Solutions > Regulatory | ✅ 8 | ✅ 5 | ⚠️ | ✅ |
| Integrations | Product > Integrations | ✅ 2 | - | ⚠️ | ✅ Sandbox |
| Dashboards | Product > Analytics | ✅ 4 | ✅ 1 | ✅ | ✅ Interactive |
| Workflows | Product > Automation | ✅ 3 | ✅ 1 | ⚠️ | ✅ |

Legend: ✅ Available, ⚠️ Needs update, - Missing

### Sales Enablement by Plugin Group

```yaml
sales_playbooks:
  fraud_detection:
    discovery_questions:
      - "What's your current fraud rate?"
      - "How do you detect fraud today?"
      - "What's your average fraud loss per month?"
    
    objection_handling:
      - "Too expensive" → ROI calculator
      - "Too complex" → Easy onboarding video
      - "We have in-house" → Comparison checklist
    
    success_metrics:
      - Fraud reduction %
      - False positive rate
      - Time to detection
    
    competitive_positioning:
      - vs. Rule-based systems: "AI advantage"
      - vs. Point solutions: "Comprehensive platform"
      - vs. Build internally: "TCO comparison"

  compliance:
    discovery_questions:
      - "Which regulations apply to you?"
      - "How do you handle SAR filing today?"
      - "When's your next audit?"
    
    objection_handling:
      - "We're compliant" → Gap analysis
      - "Manual is fine" → Time savings calc
      - "Too automated" → Audit trail demo
    
    success_metrics:
      - Time to file reports
      - Audit findings count
      - Regulatory fines avoided
```

### Partner Co-Marketing Packages

```yaml
integration_partners:
  stripe:
    joint_solution: "Stripe + Zenith Fraud Prevention"
    bundle_discount: "20% off when both are used"
    co_branded_assets:
      - Landing page
      - Case study
      - Integration guide
      - Webinar series
    
  chainalysis:
    joint_solution: "Complete Crypto Compliance"
    bundle_discount: "15% off bundle"
    co_branded_assets:
      - Crypto security whitepaper
      - Joint customer stories
      - Conference booth
      - Thought leadership articles
```

---

## Summary Tables

### Plugin Count by Domain

| Domain | Subgroups | Total Plugins | Priority |
|--------|-----------|---------------|----------|
| Detection | 2 (Fraud, Risk) | 37 | P0 |
| Intelligence | 3 (AI Core, Analytics, Knowledge) | 37 | P1 |
| Integration | 4 (Payments, Data, External, Comms) | 63 | P2 |
| Presentation | 3 (Widgets, Viz, Forms) | 43 | P2 |
| Workflow | 4 (Cases, Approvals, Investigation, Automation) | 39 | P3 |
| Infrastructure | 4 (Storage, Observability, Security, DevOps) | 49 | P4 |
| Compliance | 1 (Regulations) | 20 | P1 |
| **TOTAL** | **21** | **288** | - |

### Plugin Distribution by Trust Level

| Trust Level | Publisher Type | Plugin Count | Security Model |
|-------------|----------------|--------------|----------------|
| Core | Zenith official | ~200 | No sandboxing |
| Verified | Vetted third-party | ~50 | Process isolation |
| Community | Public contributions | ~20 | Strict sandbox |
| Custom | Customer-specific | ~18 | Tenant sandbox |

### Resource Requirements by Domain

| Domain | CPU | Memory | GPU | Storage | Network |
|--------|-----|--------|-----|---------|---------|
| Detection | High | Medium | Optional | Low | Low |
| Intelligence | Very High | High | Yes | Medium | Low |
| Integration | Low | Low | No | Low | High |
| Presentation | Low | Low | No | Low | Low |
| Workflow | Medium | Low | No | Low | Medium |
| Infrastructure | Medium | Medium | No | High | High |
| Compliance | Low | Low | No | Medium | Medium |

---

## Conclusion

This taxonomy provides:

✅ **Clear Organization**: 7 domains, 21 subgroups, 288 plugins
✅ **Logical Namespacing**: Hierarchical namespace structure
✅ **Security Boundaries**: 4 trust levels with appropriate isolation
✅ **Marketplace Ready**: User-facing categories and filtering
✅ **Deployment Strategy**: Lifecycle-based grouping
✅ **Scalability**: Support for 1000+ plugins

**Next Steps**:
1. Review and approve taxonomy
2. Implement plugin registry with namespace support
3. Create plugin templates for each domain
4. Build marketplace UI with categories
5. Develop plugin SDK and documentation

---

**Document Status**: ✅ Ready for Implementation
