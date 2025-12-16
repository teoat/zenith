# Plugin Architecture Migration Plan: Complete Documentation

## Document Information
- **Document ID**: MIG-378x492-PLUGIN-001
- **Version**: 1.0
- **Classification**: Internal Planning Document
- **Created**: December 2025
- **Last Updated**: December 2025
- **Risk Assessment**: Medium-High (7/10) for full migration, Low-Medium (3/10) for phased approach

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Proposed Plugin Architecture](#3-proposed-plugin-architecture)
4. [Migration Plan Details](#4-migration-plan-details)
5. [Risk Assessment & Mitigation](#5-risk-assessment--mitigation)
6. [Technical Specifications](#6-technical-specifications)
7. [Implementation Timeline](#7-implementation-timeline)
8. [Success Metrics & KPIs](#8-success-metrics--kpis)
9. [Appendices](#9-appendices)

---

## 1. Executive Summary

### Mission
Transform the 378x492 Fraud Detection Platform from a monolithic architecture to a flexible plugin-based system with microkernel pattern and Entity-Attribute-Value (EAV) capabilities to enable dynamic extensibility, improved maintainability, and faster feature delivery.

### Strategic Objectives
- Enable runtime configuration of fraud detection rules without code changes
- Support third-party plugin ecosystem for specialized fraud detection
- Reduce deployment complexity through independent plugin versioning
- Improve system scalability and maintainability
- Maintain enterprise-grade security and performance standards

### Approach
**Phased Migration Strategy** with fraud rules prioritization, implementing comprehensive security controls, and maintaining backward compatibility through feature flags and gradual rollout.

### Expected Benefits
- 50% faster time-to-market for new fraud detection features
- 80% reduction in deployment time for rule changes
- Support for 100+ plugin types across multiple domains
- 40% improvement in developer productivity

### Risk Level
Medium-High overall, but Low-Medium for recommended phased approach with fraud rules as priority.

---

## 2. Current Architecture Analysis

### Monolithic Structure Overview
The current 378x492 platform consists of:
- **Backend**: ~50+ tightly coupled services in `backend/app/services/`
- **Frontend**: ~20+ React components with shared state management
- **Database**: Static schema with hardcoded relationships
- **Configuration**: Application-level settings, not runtime configurable

### Key Pain Points
1. **Tight Coupling**: Services directly import and depend on each other
2. **Static Rules**: Fraud detection rules embedded in code
3. **Deployment Bottlenecks**: All changes require full system deployment
4. **Scalability Issues**: Large codebase difficult to navigate and maintain
5. **Business Agility**: New fraud patterns require developer intervention

### Performance Characteristics
- **Response Time**: <50ms target maintained
- **Availability**: 99.999% uptime requirement
- **Security**: Zero-trust architecture with hardware MFA
- **Compliance**: FATF, GDPR, CCPA, SOX compliance

### Current Fraud Rules Structure
Six static rule modules:
- `ai_detection.py`: ML-based fraud detection
- `mirror_transaction.py`: Transaction mirroring detection
- `round_trip.py`: Round-trip transaction patterns
- `shell_company.py`: Shell company identification
- `structuring.py`: Transaction structuring detection
- Static threshold and condition parameters

---

## 3. Proposed Plugin Architecture

### Microkernel Pattern Overview
```
┌─────────────────────────────────────────────────┐
│                 PLUGIN REGISTRY                 │
│   • Discovery & Loading                        │
│   • Lifecycle Management                       │
│   • Security Validation                        │
│   • Version Compatibility                      │
└─────────────────────────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
┌─────────┴─────────┐ ┌────────┴─────────┐
│     CORE KERNEL   │ │  PLUGIN SYSTEM   │
│ • Authentication  │ │ • Extension Points│
│ • Database Access │ │ • Plugin Interfaces│
│ • Basic Routing   │ │ • Event System    │
│ • Security Core   │ └──────────────────┘
└───────────────────┘         │
                    ┌─────────┴─────────┐
                    │   DYNAMIC PLUGINS │
                    │ • Fraud Engines   │
                    │ • UI Components   │
                    │ • Data Connectors │
                    │ • Workflow Engines│
                    └───────────────────┘
```

### Plugin Categories

#### 1. Detection Engines
- **AI/ML Plugins**: TensorFlow, PyTorch, scikit-learn based detectors
- **Rule-Based Plugins**: Configurable rule engines with EAV parameters
- **Behavioral Plugins**: User behavior analysis engines
- **Temporal Plugins**: Time-series fraud pattern detection

#### 2. Data Connectors
- **Payment Processors**: Stripe, PayPal, bank API integrations
- **External Databases**: Legacy system connections
- **Third-Party APIs**: Credit bureaus, fraud intelligence feeds
- **Blockchain Connectors**: Cryptocurrency transaction monitoring

#### 3. UI Components
- **Dashboard Widgets**: Custom analytics panels
- **Case Management Views**: Specialized investigation interfaces
- **Reporting Interfaces**: Custom report builders
- **Configuration Panels**: Runtime settings management

#### 4. Workflow Engines
- **Case Assignment**: AI-powered case routing
- **Approval Workflows**: Multi-level review processes
- **Escalation Rules**: Automated priority management
- **Integration Hubs**: Third-party system orchestration

### EAV Pattern Implementation

#### Entity-Attribute-Value Structure
```sql
-- Core EAV Tables
CREATE TABLE eav_entities (
    entity_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'fraud_rule', 'case', 'user', etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE eav_attributes (
    attribute_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_type VARCHAR(20) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    validation_rules JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE eav_values (
    value_id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES eav_entities(entity_id),
    attribute_id INTEGER REFERENCES eav_attributes(attribute_id),
    value_text TEXT,
    value_numeric DECIMAL,
    value_boolean BOOLEAN,
    value_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Fraud Rule EAV Example
```json
{
  "entity_type": "fraud_rule",
  "attributes": {
    "threshold": {"type": "number", "min": 0, "max": 1000000},
    "condition": {"type": "string", "enum": ["greater_than", "less_than", "equals"]},
    "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
    "enabled": {"type": "boolean", "default": true},
    "description": {"type": "string", "max_length": 500}
  }
}
```

### Plugin Discovery System

#### Hybrid Discovery Approach
1. **Entry Points** (Production): setuptools-based plugin registration
2. **File System** (Development): Directory scanning for rapid iteration
3. **Database Registry** (Runtime): Metadata storage for plugin management

#### Plugin Metadata Structure
```python
@dataclass
class PluginMetadata:
    name: str
    version: str
    author: str
    description: str
    dependencies: Dict[str, str]  # name: version_constraint
    capabilities: List[str]       # ['fraud_detection', 'ui_component']
    security_level: str          # 'trusted', 'verified', 'untrusted'
    signature: Optional[str]     # PGP signature for verification
```

### Security Framework

#### Multi-Layer Security
1. **Code Signing**: PGP/GPG signature verification
2. **Permission System**: Capability-based access control
3. **Sandboxing**: Restricted execution environments
4. **Audit Trails**: Comprehensive plugin action logging
5. **Runtime Monitoring**: Behavior analysis and anomaly detection

#### Plugin Permission Model
```python
plugin_permissions = {
    'fraud_detection': ['read_transactions', 'write_cases'],
    'ui_components': ['render_html', 'access_user_session'],
    'data_connectors': ['external_api_calls', 'database_read'],
    'admin_tools': ['system_configuration', 'user_management']
}
```

---

## 4. Migration Plan Details

### Phase 1: Enhanced Foundation (Weeks 1-3)
**Goal**: Establish plugin infrastructure without affecting production

#### Tasks
1. Create plugin registry system
2. Implement EAV database schema
3. Set up security validation framework
4. Configure hybrid plugin discovery

#### Deliverables
- `backend/core/plugin_system/` package
- EAV migration scripts
- Security validation module
- Plugin discovery service

#### Risk Level: LOW (2/10)

### Phase 2: Fraud Rules Migration (Weeks 4-6) - PRIORITY
**Goal**: Convert static rules to dynamic plugin system

#### Tasks
1. Extract hardcoded rule parameters to EAV
2. Convert rule modules to plugin format
3. Implement rule configuration UI
4. Add plugin lifecycle management

#### Affected Files
**Backend:**
- `backend/app/services/fraud/rules/ai_detection.py` → `plugins/fraud_rules/ai_detection/`
- `backend/app/services/fraud/rules/mirror_transaction.py` → `plugins/fraud_rules/mirror_transaction/`
- `backend/app/services/fraud/rules/round_trip.py` → `plugins/fraud_rules/round_trip/`
- `backend/app/services/fraud/rules/shell_company.py` → `plugins/fraud_rules/shell_company/`
- `backend/app/services/fraud/rules/structuring.py` → `plugins/fraud_rules/structuring/`
- `backend/app/services/fraud/fraud_rules_engine.py` (EAV integration)

**Frontend:**
- `frontend/src/pages/settings/RuleConfiguration.tsx` (new)
- `frontend/src/services/rules.ts` (new)

#### Risk Level: LOW-MEDIUM (3/10)

### Phase 3: Service Decoupling (Weeks 7-10) - PARALLEL
**Goal**: Extract core services into plugins

#### Service Migration Order
1. **Analytics Service** (Low risk, isolated)
2. **Reporting Service** (Low risk, optional)
3. **AI Service** (Medium risk, core functionality)
4. **Compliance Service** (High risk, regulatory impact)

#### Plugin Structure Template
```
plugins/
├── fraud_engines/
│   ├── ai_detection/
│   │   ├── __init__.py
│   │   ├── plugin.py
│   │   ├── metadata.json
│   │   └── requirements.txt
│   └── rule_based/
├── ui_components/
│   ├── dashboard_widgets/
│   └── case_views/
└── data_connectors/
    ├── payment_processors/
    └── external_apis/
```

#### Risk Level: MEDIUM (5/10)

### Phase 4: Global EAV Implementation (Weeks 11-12)
**Goal**: Extend EAV to all dynamic entities

#### EAV Entities Implementation
- **Cases**: Dynamic case types, custom fields, workflows
- **Users**: Custom roles, permissions, preferences
- **Configurations**: System settings, feature flags
- **Reports**: Custom report definitions, filters

#### Performance Optimizations
- Indexed EAV queries with composite keys
- Redis caching for attribute metadata
- Query result set caching
- Asynchronous EAV value loading

#### Risk Level: MEDIUM-HIGH (6/10)

### Phase 5: Enterprise Features (Weeks 13-16)
**Goal**: Advanced plugin capabilities

#### Features
1. **Plugin Marketplace**: Rating/review system
2. **Hot-Swapping**: Runtime plugin updates
3. **Multi-Tenant Isolation**: Tenant-specific plugins
4. **Dependency Management**: Automatic plugin resolution
5. **Performance Monitoring**: Plugin-specific metrics

#### Advanced Capabilities
- **Plugin Composition**: Plugins building on other plugins
- **Event-Driven Architecture**: Plugin communication via events
- **Plugin APIs**: RESTful interfaces for plugin interaction
- **Version Pinning**: Environment-specific plugin versions

#### Risk Level: HIGH (7/10)

---

## 5. Risk Assessment & Mitigation

### Overall Risk Matrix

| Component | Technical Risk | Business Risk | Operational Risk | Mitigation Level |
|-----------|----------------|----------------|------------------|------------------|
| Plugin Registry | Low | Low | Low | High |
| EAV Schema | Medium | Low | Medium | High |
| Fraud Rules Migration | Low | Low | Low | High |
| Service Decoupling | Medium | Medium | Medium | Medium |
| Global EAV | High | Medium | Medium | Medium |
| Enterprise Features | High | High | High | Low |

### Risk Mitigation Strategies

#### Technical Mitigation
1. **Feature Flags**: All new features behind configurable flags
2. **Gradual Rollout**: 1% → 10% → 50% → 100% traffic progression
3. **Circuit Breakers**: Automatic failure isolation
4. **Performance Baselines**: Continuous monitoring against KPIs

#### Operational Mitigation
1. **Comprehensive Testing**: Unit, integration, chaos, performance
2. **Monitoring Dashboards**: Plugin health and performance tracking
3. **Incident Response**: Pre-defined procedures for plugin issues
4. **Rollback Procedures**: Documented reversion strategies

#### Business Mitigation
1. **Fallback Systems**: Original monolithic code as backup
2. **Stakeholder Communication**: Regular progress updates
3. **Success Metrics**: Clear KPIs and success criteria
4. **Change Management**: User training and documentation

### Contingency Plans

#### Emergency Rollback
- **Immediate**: Feature flag disable (0-5 minutes)
- **Fast**: Plugin unload and cache clear (5-15 minutes)
- **Full**: Database schema rollback (15-60 minutes)

#### Recovery Procedures
- **Plugin Failure**: Automatic quarantine and notification
- **Performance Issues**: Load shedding and traffic throttling
- **Security Breach**: Plugin isolation and forensic analysis
- **Data Issues**: Point-in-time database recovery

---

## 6. Technical Specifications

### Plugin Interface Definition

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

@dataclass
class PluginContext:
    plugin_id: str
    version: str
    config: Dict[str, Any]
    permissions: List[str]

class PluginInterface(ABC):
    """Base interface for all plugins"""
    
    @property
    @abstractmethod
    def metadata(self) -> PluginMetadata:
        """Plugin metadata"""
        pass
    
    @abstractmethod
    async def initialize(self, context: PluginContext) -> bool:
        """Initialize plugin with context"""
        pass
    
    @abstractmethod
    async def execute(self, *args, **kwargs) -> Any:
        """Main plugin execution method"""
        pass
    
    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup plugin resources"""
        pass
    
    @abstractmethod
    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        """Validate plugin configuration"""
        pass
```

### EAV Query Optimization

```python
class EAVQueryOptimizer:
    """Optimizes EAV queries for performance"""
    
    async def get_entity_attributes(self, entity_id: int) -> Dict[str, Any]:
        """Optimized attribute retrieval with caching"""
        cache_key = f"eav_entity_{entity_id}"
        
        # Check Redis cache first
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Optimized query with joins
        query = """
        SELECT a.attribute_name, 
               COALESCE(v.value_text, v.value_numeric::text, v.value_boolean::text, v.value_json::text) as value
        FROM eav_attributes a
        JOIN eav_values v ON a.attribute_id = v.attribute_id
        WHERE v.entity_id = $1
        """
        
        results = await self.db.fetch(query, entity_id)
        attributes = {row['attribute_name']: row['value'] for row in results}
        
        # Cache for 5 minutes
        await self.redis.setex(cache_key, 300, json.dumps(attributes))
        return attributes
```

### Plugin Security Implementation

```python
class PluginSecurityManager:
    """Manages plugin security and isolation"""
    
    async def validate_plugin_signature(self, plugin_path: str) -> bool:
        """Validate PGP signature of plugin package"""
        # Implementation using gnupg library
        pass
    
    async def create_sandbox(self, plugin_id: str) -> Sandbox:
        """Create isolated execution environment"""
        # Implementation using subprocess with resource limits
        pass
    
    async def check_permissions(self, plugin_id: str, action: str) -> bool:
        """Check if plugin has permission for action"""
        plugin_permissions = await self.get_plugin_permissions(plugin_id)
        return action in plugin_permissions
    
    async def audit_plugin_action(self, plugin_id: str, action: str, details: Dict[str, Any]):
        """Log plugin actions for audit trail"""
        audit_entry = {
            'timestamp': datetime.utcnow(),
            'plugin_id': plugin_id,
            'action': action,
            'details': details,
            'user_id': self.current_user_id
        }
        await self.audit_log.log(audit_entry)
```

### Plugin Discovery Implementation

```python
class PluginDiscoveryService:
    """Hybrid plugin discovery system"""
    
    async def discover_plugins(self) -> List[PluginMetadata]:
        """Discover plugins using multiple methods"""
        plugins = []
        
        # Method 1: Entry points (production)
        plugins.extend(await self._discover_entry_points())
        
        # Method 2: File system scanning (development)
        plugins.extend(await self._discover_filesystem())
        
        # Method 3: Database registry (runtime)
        plugins.extend(await self._discover_database())
        
        return self._deduplicate_plugins(plugins)
    
    async def _discover_entry_points(self) -> List[PluginMetadata]:
        """Discover plugins via setuptools entry points"""
        discovered = []
        for entry_point in pkg_resources.iter_entry_points('fraud_detection.plugins'):
            try:
                plugin_class = entry_point.load()
                metadata = plugin_class.metadata
                discovered.append(metadata)
            except Exception as e:
                logger.warning(f"Failed to load plugin {entry_point.name}: {e}")
        return discovered
```

---

## 7. Implementation Timeline

### Detailed Timeline with Milestones

#### Phase 1: Enhanced Foundation (Weeks 1-3)
- **Week 1**: Plugin registry design and core interfaces
- **Week 2**: EAV schema design and migration scripts
- **Week 3**: Security framework and discovery system

**Milestones:**
- Plugin registry functional
- EAV tables created and tested
- Security validation working

#### Phase 2: Fraud Rules Migration (Weeks 4-6)
- **Week 4**: Rule parameter extraction and EAV population
- **Week 5**: Plugin wrapper creation and testing
- **Week 6**: UI configuration and integration testing

**Milestones:**
- All 6 rule types converted to plugins
- EAV configuration working
- Rule accuracy maintained

#### Phase 3: Service Decoupling (Weeks 7-10)
- **Week 7-8**: Analytics and reporting services
- **Week 9**: AI service decoupling
- **Week 10**: Compliance service and final testing

**Milestones:**
- 4 core services successfully decoupled
- No performance degradation
- All functionality preserved

#### Phase 4: Global EAV Implementation (Weeks 11-12)
- **Week 11**: Case and user EAV implementation
- **Week 12**: Configuration and reporting EAV

**Milestones:**
- EAV working across all entities
- Performance optimizations implemented
- Query times within acceptable ranges

#### Phase 5: Enterprise Features (Weeks 13-16)
- **Week 13-14**: Marketplace and hot-swapping
- **Week 15**: Multi-tenant features
- **Week 16**: Final testing and documentation

**Milestones:**
- Plugin marketplace operational
- Hot-swapping working safely
- Multi-tenant isolation verified

### Resource Allocation
- **Development Team**: 4 senior developers, 2 QA engineers
- **DevOps Team**: 2 engineers for infrastructure
- **Security Team**: 1 engineer for plugin security
- **Business Team**: 1 analyst for requirements

### Dependencies
- **External**: setuptools, stevedore for plugin management
- **Internal**: Core database and authentication services
- **Infrastructure**: Kubernetes for containerized plugins

---

## 8. Success Metrics & KPIs

### Technical KPIs

#### Performance Metrics
- **Plugin Load Time**: <100ms average (target: <50ms)
- **EAV Query Performance**: <50ms P95 response time
- **Memory Overhead**: <5% increase from plugins
- **CPU Usage**: <10% increase from plugin processing

#### Reliability Metrics
- **Plugin Success Rate**: >99.5% successful executions
- **System Availability**: Maintain 99.999% uptime
- **Error Rate**: <0.1% plugin-related errors
- **Recovery Time**: <5 minutes for plugin failures

#### Security Metrics
- **Plugin Validation**: 100% signature verification
- **Security Incidents**: Zero plugin-related breaches
- **Audit Compliance**: 100% plugin action logging
- **Permission Violations**: <0.01% unauthorized actions

### Business KPIs

#### Feature Delivery
- **Time-to-Market**: 50% faster for new fraud features
- **Deployment Frequency**: 3x increase in release frequency
- **Rule Changes**: From days to hours for configuration
- **Customization**: Support 10+ customer-specific configurations

#### Operational Efficiency
- **Development Velocity**: 40% improvement in developer productivity
- **Maintenance Cost**: 30% reduction in maintenance overhead
- **Scalability**: Support 5x increase in concurrent users
- **Resource Utilization**: 25% better infrastructure efficiency

### Quality Metrics

#### Code Quality
- **Test Coverage**: 95%+ for plugin system
- **Code Complexity**: Maintain cyclomatic complexity <10
- **Technical Debt**: <5% debt ratio
- **Documentation**: 100% API documentation coverage

#### User Experience
- **Response Time**: Maintain <50ms for all operations
- **User Satisfaction**: >95% user satisfaction score
- **Error Messages**: Clear, actionable error communications
- **Training Time**: <2 hours for new plugin usage

### Monitoring & Alerting

#### Real-time Dashboards
- Plugin health status
- Performance metrics by plugin
- Security event monitoring
- EAV query performance

#### Automated Alerts
- Plugin load failures
- Performance degradation >10%
- Security violations
- Configuration errors

---

## 9. Appendices

### Appendix A: Plugin Development Guide

#### Creating a Basic Plugin
```python
from typing import Dict, Any, List
from core.plugin_system import PluginInterface, PluginMetadata, PluginContext

class MyFraudDetector(PluginInterface):
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="my_fraud_detector",
            version="1.0.0",
            author="378x492 Team",
            description="Custom fraud detection algorithm",
            dependencies={},
            capabilities=["fraud_detection"],
            security_level="trusted"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        self.config = context.config
        return True
    
    async def execute(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        # Fraud detection logic here
        score = self._calculate_fraud_score(transaction_data)
        return {
            "is_fraud": score > self.config.get("threshold", 60),
            "confidence": score / 100,
            "reason": f"Score: {score}"
        }
    
    async def cleanup(self) -> None:
        # Cleanup resources
        pass
    
    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        errors = []
        if "threshold" not in config:
            errors.append("threshold is required")
        if not isinstance(config.get("threshold", 0), (int, float)):
            errors.append("threshold must be numeric")
        return errors
```

#### Plugin Packaging
```python
# setup.py
from setuptools import setup

setup(
    name="fraud-detection-plugins",
    version="1.0.0",
    packages=["my_fraud_detector"],
    entry_points={
        "fraud_detection.plugins": [
            "my_detector = my_fraud_detector.plugin:MyFraudDetector"
        ]
    }
)
```

### Appendix B: EAV Schema Migration

```sql
-- EAV Migration Script
BEGIN;

-- Create EAV tables
CREATE TABLE eav_entities (
    entity_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    external_id VARCHAR(100), -- Reference to original table
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE eav_attributes (
    attribute_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_type VARCHAR(20) NOT NULL,
    validation_rules JSONB,
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(entity_type, attribute_name)
);

CREATE TABLE eav_values (
    value_id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES eav_entities(entity_id) ON DELETE CASCADE,
    attribute_id INTEGER REFERENCES eav_attributes(attribute_id),
    value_text TEXT,
    value_numeric DECIMAL,
    value_boolean BOOLEAN,
    value_json JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(entity_id, attribute_id)
);

-- Performance indexes
CREATE INDEX idx_eav_entities_type ON eav_entities(entity_type);
CREATE INDEX idx_eav_entities_external ON eav_entities(external_id);
CREATE INDEX idx_eav_attributes_type ON eav_attributes(entity_type);
CREATE INDEX idx_eav_values_entity ON eav_values(entity_id);
CREATE INDEX idx_eav_values_attribute ON eav_values(attribute_id);

-- Migrate existing fraud rules
INSERT INTO eav_entities (entity_type, external_id)
SELECT 'fraud_rule', rule_id FROM fraud_rules;

-- Add rule attributes
INSERT INTO eav_attributes (entity_type, attribute_name, attribute_type, validation_rules)
VALUES 
('fraud_rule', 'threshold', 'number', '{"min": 0, "max": 100}'),
('fraud_rule', 'enabled', 'boolean', '{}'),
('fraud_rule', 'severity', 'string', '{"enum": ["low", "medium", "high", "critical"]}');

COMMIT;
```

### Appendix C: Risk Assessment Matrix

| Risk Category | Probability | Impact | Mitigation | Residual Risk |
|---------------|-------------|--------|------------|----------------|
| Plugin Loading Failure | Low | High | Circuit breakers, fallbacks | Low |
| EAV Performance Degradation | Medium | Medium | Caching, optimization | Low |
| Security Vulnerabilities | Low | Critical | Code signing, sandboxing | Very Low |
| Compatibility Issues | Medium | Medium | Version constraints, testing | Low |
| Operational Complexity | High | Low | Training, documentation | Medium |

### Appendix D: Testing Strategy

#### Unit Testing
- Plugin interface compliance
- EAV data validation
- Security permission checks
- Error handling scenarios

#### Integration Testing
- Plugin discovery and loading
- Inter-plugin communication
- EAV query performance
- Security boundary testing

#### Chaos Testing
- Plugin failure simulation
- Network partition testing
- Resource exhaustion scenarios
- Database failure recovery

#### Performance Testing
- Plugin load time benchmarking
- EAV query optimization validation
- Concurrent plugin execution
- Memory usage monitoring

### Appendix E: Rollback Procedures

#### Emergency Rollback (0-5 minutes)
```bash
# Disable plugin system via feature flag
curl -X POST /api/admin/features/disable \
  -d '{"feature": "plugin_system", "reason": "emergency_rollback"}'
```

#### Fast Rollback (5-15 minutes)
```bash
# Unload all plugins
curl -X POST /api/admin/plugins/unload-all

# Clear plugin caches
redis-cli FLUSHDB

# Restart application services
kubectl rollout restart deployment/fraud-detection
```

#### Full Rollback (15-60 minutes)
```sql
-- Revert EAV schema changes
BEGIN;
DROP TABLE IF EXISTS eav_values;
DROP TABLE IF EXISTS eav_attributes;
DROP TABLE IF EXISTS eav_entities;
-- Restore original schema
COMMIT;
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2025 | AI Assistant | Initial comprehensive documentation |

## Approval & Review

- **Technical Review**: [Pending]
- **Security Review**: [Pending]
- **Business Approval**: [Pending]

---

*This document serves as the comprehensive plan for migrating the 378x492 Fraud Detection Platform to a plugin-based architecture. All implementations should follow this plan to ensure consistency, security, and maintainability.*