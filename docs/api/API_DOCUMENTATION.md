# 378x492 Fraud Detection Platform - API Documentation

**Generated on:** 2025-12-17 13:00:06
**Total Routers:** 36
**Total Endpoints:** 219

## API Overview

This API provides comprehensive fraud detection and investigation capabilities for the 378x492 platform.

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints by Router

### ADMIN Router
**Endpoints:** 7
**Tags:** None

#### GET /database/performance
**Route Name:** get_database_performance
**Summary:** None

Get database performance metrics (Admin only)

Get database performance metrics (Admin only)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /database/stats
**Route Name:** get_database_stats
**Summary:** None

Get comprehensive database statistics (Admin only)

Get comprehensive database statistics (Admin only)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /database/optimize
**Route Name:** optimize_database
**Summary:** None

Trigger database optimization (Admin only)

Trigger database optimization (Admin only)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /database/analyze-query
**Route Name:** analyze_query
**Summary:** None

Analyze query performance with EXPLAIN (Admin only)

Analyze query performance with EXPLAIN (Admin only)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /cache/stats
**Route Name:** get_cache_statistics
**Summary:** None

Get comprehensive cache statistics (Admin only)

Get comprehensive cache statistics (Admin only)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /cache/namespace/{namespace}
**Route Name:** clear_cache_by_namespace
**Summary:** None

Clear all cache entries in a specific namespace (Admin only)

Clear all cache entries in a specific namespace (Admin only)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /cache/all
**Route Name:** clear_entire_cache
**Summary:** None

Clear all cache entries - DESTRUCTIVE operation (Admin only)

Clear all cache entries - DESTRUCTIVE operation (Admin only)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### ADVANCED_AI Router
**Endpoints:** 6
**Tags:** None

#### POST /advanced-ai/rag/query
**Route Name:** local_rag_query
**Summary:** None

Retrieve documents using Local RAG (TF-IDF/Cosine Similarity).

Retrieve documents using Local RAG (TF-IDF/Cosine Similarity).

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /advanced-ai/rag/add
**Route Name:** local_rag_add
**Summary:** None

Add a document to the local vector store.

Add a document to the local vector store.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /advanced-ai/multimodal/image
**Route Name:** analyze_image
**Summary:** None

Analyze an image for metadata and text (OCR).

Analyze an image for metadata and text (OCR).

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /advanced-ai/multimodal/text
**Route Name:** analyze_text
**Summary:** None

Analyze text for fraud indicators.

Analyze text for fraud indicators.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /advanced-ai/red-team/generate
**Route Name:** generate_red_team_prompts
**Summary:** None

Generate adversarial prompts to test a feature.

Generate adversarial prompts to test a feature.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /advanced-ai/stats
**Route Name:** ai_stats
**Summary:** None

Get statistics about the advanced AI services.

Get statistics about the advanced AI services.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### AI Router
**Endpoints:** 22
**Tags:** AI

AI API Router for 378x492 Fraud Detection
Provides endpoints for AI analysis and semantic search

#### POST /search
**Route Name:** semantic_search
**Summary:** None

Perform semantic search across case data and evidence.

This endpoint uses AI-powered semantic search to find relevant information
based on natural language queries, going beyond simple keyword matching.

Perform semantic search across case data and evidence.

    This endpoint uses AI-powered semantic search to find relevant information
    based on natural language queries, going beyond simple keyword matching.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /analyze
**Route Name:** ai_analyze
**Summary:** None

Perform AI-powered analysis on case data or evidence.

Supports various analysis types:
- case_summary: Generate comprehensive case summary
- fraud_pattern: Detect fraud patterns in transactions
- entity_linkage: Analyze relationships between entities
- risk_assessment: Assess overall risk level
- evidence_analysis: Analyze evidence for fraud indicators

Perform AI-powered analysis on case data or evidence.

    Supports various analysis types:
    - case_summary: Generate comprehensive case summary
    - fraud_pattern: Detect fraud patterns in transactions
    - entity_linkage: Analyze relationships between entities
    - risk_assessment: Assess overall risk level
    - evidence_analysis: Analyze evidence for fraud indicators

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /insights
**Route Name:** get_insights
**Summary:** None

Generate contextual AI insights based on current application state.

Provides intelligent suggestions, warnings, and opportunities based on
the user's current page, selected data, and overall context.

Generate contextual AI insights based on current application state.

    Provides intelligent suggestions, warnings, and opportunities based on
    the user's current page, selected data, and overall context.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /documents
**Route Name:** add_document
**Summary:** None

Add a document to the AI vector store for semantic search.

This endpoint indexes documents for future semantic search queries.
Documents can be case descriptions, evidence content, or any text data.

Add a document to the AI vector store for semantic search.

    This endpoint indexes documents for future semantic search queries.
    Documents can be case descriptions, evidence content, or any text data.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /documents/{doc_id}
**Route Name:** remove_document
**Summary:** None

Remove a document from the AI vector store.

This permanently removes the document from semantic search capabilities.

Remove a document from the AI vector store.

    This permanently removes the document from semantic search capabilities.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /multi-persona-analysis
**Route Name:** multi_persona_analysis
**Summary:** None

Perform analysis using multiple AI personas.

Perform analysis using multiple AI personas.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /investigate/{subject_id}
**Route Name:** investigate_subject
**Summary:** None

Perform deep dive investigation on a subject.

Perform deep dive investigation on a subject.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /proactive-suggestions
**Route Name:** get_proactive_suggestions
**Summary:** None

Get proactive suggestions based on an alert.

Get proactive suggestions based on an alert.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /status
**Route Name:** get_ai_status
**Summary:** None

Get the current status of the AI service.

Returns information about the AI service health, indexed documents,
and available analysis capabilities.

Get the current status of the AI service.

    Returns information about the AI service health, indexed documents,
    and available analysis capabilities.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /chat
**Route Name:** ai_chat
**Summary:** None

Interact with the Frenly AI Assistant.
Supports multi-turn conversations and persona-based responses.

Interact with the Frenly AI Assistant.
    Supports multi-turn conversations and persona-based responses.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /analyze/case
**Route Name:** analyze_case_ai
**Summary:** None

Perform comprehensive AI-powered case analysis

Perform comprehensive AI-powered case analysis

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /health
**Route Name:** ai_health_check
**Summary:** None

Health check for AI service components

Health check for AI service components

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /models/status
**Route Name:** get_model_status
**Summary:** None

Get status of all AI models

Get status of all AI models

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /insights/{case_id}
**Route Name:** get_case_insights
**Summary:** None

Get AI-generated insights for a specific case

Get AI-generated insights for a specific case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /feedback/{transaction_id}
**Route Name:** submit_ai_feedback
**Summary:** None

Submit feedback on AI analysis results for model improvement

Submit feedback on AI analysis results for model improvement

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /federated/update
**Route Name:** apply_federated_update
**Summary:** None

Apply federated learning updates from partner institutions

Apply federated learning updates from partner institutions

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /performance
**Route Name:** get_ai_performance_metrics
**Summary:** None

Get AI model performance metrics

Get AI model performance metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /anomaly-detection
**Route Name:** detect_anomalies
**Summary:** None

Real-time anomaly detection using AI

Real-time anomaly detection using AI

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /chat
**Route Name:** chat_with_ai
**Summary:** None

Chat with domain-specific fraud investigation personas using advanced LLM integration

Chat with domain-specific fraud investigation personas using advanced LLM integration

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /chat/multi-persona
**Route Name:** multi_persona_chat
**Summary:** None

Get responses from multiple personas concurrently for comprehensive analysis

Get responses from multiple personas concurrently for comprehensive analysis

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /analyze/multimodal
**Route Name:** multimodal_analysis
**Summary:** None

Perform multi-modal analysis combining transaction, behavioral, network, and document analysis

Perform multi-modal analysis combining transaction, behavioral, network, and document analysis

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /llm/status
**Route Name:** get_llm_status
**Summary:** None

Get status of all LLM providers and personas

Get status of all LLM providers and personas

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### ANALYTICS Router
**Endpoints:** 5
**Tags:** None

#### GET /analytics/cases
**Route Name:** get_case_analytics
**Summary:** None

Get optimized case analytics

Get optimized case analytics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /analytics/transactions
**Route Name:** get_transaction_analytics
**Summary:** None

Get transaction analytics with optimized aggregates

Get transaction analytics with optimized aggregates

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /analytics/overview
**Route Name:** get_system_overview
**Summary:** None

Get system overview statistics

Get system overview statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /analytics/temporal-flow
**Route Name:** get_temporal_flow
**Summary:** None

Get temporal flow data for visualization (TransactionFlow format)

Get temporal flow data for visualization (TransactionFlow format)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /analytics/behavioral
**Route Name:** get_behavioral_analytics
**Summary:** None

Get behavioral analytics for heatmaps

Get behavioral analytics for heatmaps

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### APM Router
**Endpoints:** 13
**Tags:** apm-monitoring

#### GET /apm/summary
**Route Name:** get_apm_summary_endpoint
**Summary:** None

Get comprehensive APM summary

Returns:
    APM summary including metrics, spans, alerts, and system metrics

Get comprehensive APM summary

    Returns:
        APM summary including metrics, spans, alerts, and system metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /apm/metrics
**Route Name:** get_metrics
**Summary:** None

Get performance metrics

Args:
    name: Filter by metric name
    start_time: Start time filter
    end_time: End time filter
    limit: Maximum number of results

Returns:
    List of performance metrics

Get performance metrics

    Args:
        name: Filter by metric name
        start_time: Start time filter
        end_time: End time filter
        limit: Maximum number of results

    Returns:
        List of performance metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /apm/spans
**Route Name:** get_spans
**Summary:** None

Get distributed tracing spans

Args:
    trace_id: Filter by trace ID
    operation_name: Filter by operation name
    start_time: Start time filter
    end_time: End time filter
    limit: Maximum number of results

Returns:
    List of tracing spans

Get distributed tracing spans

    Args:
        trace_id: Filter by trace ID
        operation_name: Filter by operation name
        start_time: Start time filter
        end_time: End time filter
        limit: Maximum number of results

    Returns:
        List of tracing spans

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /apm/alerts
**Route Name:** get_alerts
**Summary:** None

Get system alerts

Args:
    severity: Filter by alert severity (info, warning, error, critical)
    resolved: Filter by resolved status
    start_time: Start time filter
    end_time: End time filter
    limit: Maximum number of results

Returns:
    List of system alerts

Get system alerts

    Args:
        severity: Filter by alert severity (info, warning, error, critical)
        resolved: Filter by resolved status
        start_time: Start time filter
        end_time: End time filter
        limit: Maximum number of results

    Returns:
        List of system alerts

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /apm/metrics
**Route Name:** create_metric
**Summary:** None

Create a performance metric

Args:
    name: Metric name
    value: Metric value
    metric_type: Metric type
    tags: Metric tags
    unit: Metric unit

Returns:
    Metric creation result

Create a performance metric

    Args:
        name: Metric name
        value: Metric value
        metric_type: Metric type
        tags: Metric tags
        unit: Metric unit

    Returns:
        Metric creation result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /apm/spans/start
**Route Name:** start_span_endpoint
**Summary:** None

Start a distributed tracing span

Args:
    operation_name: Operation name
    trace_id: Trace ID
    parent_span_id: Parent span ID
    tags: Span tags

Returns:
    Span creation result with span ID

Start a distributed tracing span

    Args:
        operation_name: Operation name
        trace_id: Trace ID
        parent_span_id: Parent span ID
        tags: Span tags

    Returns:
        Span creation result with span ID

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /apm/spans/{span_id}/finish
**Route Name:** finish_span_endpoint
**Summary:** None

Finish a distributed tracing span

Args:
    span_id: Span ID to finish
    status: Span status
    error_message: Error message if status is error

Returns:
    Span completion result

Finish a distributed tracing span

    Args:
        span_id: Span ID to finish
        status: Span status
        error_message: Error message if status is error

    Returns:
        Span completion result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /apm/alerts
**Route Name:** create_alert_endpoint
**Summary:** None

Create a system alert

Args:
    severity: Alert severity
    title: Alert title
    message: Alert message
    source: Alert source
    metadata: Alert metadata
    tags: Alert tags

Returns:
    Alert creation result

Create a system alert

    Args:
        severity: Alert severity
        title: Alert title
        message: Alert message
        source: Alert source
        metadata: Alert metadata
        tags: Alert tags

    Returns:
        Alert creation result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### PUT /apm/alerts/{alert_id}/resolve
**Route Name:** resolve_alert_endpoint
**Summary:** None

Resolve a system alert

Args:
    alert_id: Alert ID to resolve

Returns:
    Alert resolution result

Resolve a system alert

    Args:
        alert_id: Alert ID to resolve

    Returns:
        Alert resolution result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /apm/system-metrics
**Route Name:** get_system_metrics
**Summary:** None

Get current system metrics

Returns:
    System performance metrics

Get current system metrics

    Returns:
        System performance metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /apm/aggregated-metrics
**Route Name:** get_aggregated_metrics
**Summary:** None

Get aggregated metrics for a time window

Args:
    name: Metric name
    aggregation: Aggregation type
    time_window_minutes: Time window in minutes

Returns:
    Aggregated metric values

Get aggregated metrics for a time window

    Args:
        name: Metric name
        aggregation: Aggregation type
        time_window_minutes: Time window in minutes

    Returns:
        Aggregated metric values

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /apm/export
**Route Name:** export_apm_data
**Summary:** None

Export APM data to file

Args:
    file_path: Export file path
    include_metrics: Include metrics in export
    include_spans: Include spans in export
    include_alerts: Include alerts in export

Returns:
    Export result

Export APM data to file

    Args:
        file_path: Export file path
        include_metrics: Include metrics in export
        include_spans: Include spans in export
        include_alerts: Include alerts in export

    Returns:
        Export result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /apm/dashboard
**Route Name:** get_dashboard_data
**Summary:** None

Get dashboard data for monitoring UI

Returns:
    Dashboard data including charts and key metrics

Get dashboard data for monitoring UI

    Returns:
        Dashboard data including charts and key metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### AUDIT Router
**Endpoints:** 1
**Tags:** None

#### GET /
**Route Name:** get_audit_logs
**Summary:** None

Returns paginated audit logs

Returns paginated audit logs

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### AUTH Router
**Endpoints:** 5
**Tags:** None

#### POST /register
**Route Name:** register
**Summary:** None

Register a new user with password strength validation

Register a new user with password strength validation

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /login
**Route Name:** login
**Summary:** None

Authenticate user and return JWT tokens.
Supports MFA: If user has MFA enabled, mfa_code is required.

Authenticate user and return JWT tokens.
    Supports MFA: If user has MFA enabled, mfa_code is required.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /mfa/setup
**Route Name:** mfa_setup
**Summary:** None

Generate MFA secret and QR code URI for setup

Generate MFA secret and QR code URI for setup

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /mfa/verify
**Route Name:** mfa_verify
**Summary:** None

Verify MFA code and enable MFA for the account

Verify MFA code and enable MFA for the account

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /register
**Route Name:** register
**Summary:** None

Register a new user and return JWT tokens

Register a new user and return JWT tokens

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### BACKUP Router
**Endpoints:** 10
**Tags:** Backup & Recovery

Backup and Recovery API Router
Provides endpoints for backup management and disaster recovery

SECURITY: All endpoints require admin authentication.
Restore operations should require MFA in production.

#### POST /backup/create
**Route Name:** create_backup
**Summary:** None

Create a new backup of the system.

This endpoint supports both full and incremental backups.
Full backups contain all system data, while incremental backups
only contain changes since the last full backup.

Create a new backup of the system.

    This endpoint supports both full and incremental backups.
    Full backups contain all system data, while incremental backups
    only contain changes since the last full backup.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /backup/restore
**Route Name:** restore_backup
**Summary:** None

Restore system from a backup.

This operation will restore the system to the state captured
in the specified backup. Use with caution as it may overwrite
current data.

Restore system from a backup.

    This operation will restore the system to the state captured
    in the specified backup. Use with caution as it may overwrite
    current data.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /backup/status
**Route Name:** get_backup_status
**Summary:** None

Get current backup system status and statistics.

Returns information about backup operations, recent backups,
and system configuration.

Get current backup system status and statistics.

    Returns information about backup operations, recent backups,
    and system configuration.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /backup/list
**Route Name:** list_backups
**Summary:** None

List all available backups.

Returns a list of all backups in the system, including
full and incremental backups with their metadata.

List all available backups.

    Returns a list of all backups in the system, including
    full and incremental backups with their metadata.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /backup/verify/{backup_id}
**Route Name:** verify_backup_integrity
**Summary:** None

Verify the integrity of a specific backup.

Checks the backup archive integrity using SHA-256 hash
verification and validates the archive structure.

Verify the integrity of a specific backup.

    Checks the backup archive integrity using SHA-256 hash
    verification and validates the archive structure.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /backup/{backup_id}
**Route Name:** delete_backup
**Summary:** None

Delete a specific backup.

Permanently removes the backup from the system.
Use with caution as deleted backups cannot be recovered.

Delete a specific backup.

    Permanently removes the backup from the system.
    Use with caution as deleted backups cannot be recovered.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /backup/cleanup
**Route Name:** cleanup_old_backups
**Summary:** None

Clean up old backups based on retention policy.

Removes backups older than the configured retention period
to free up disk space.

Clean up old backups based on retention policy.

    Removes backups older than the configured retention period
    to free up disk space.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /backup/config
**Route Name:** get_backup_config
**Summary:** None

Get backup system configuration.

Returns the current backup configuration settings.

Get backup system configuration.

    Returns the current backup configuration settings.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### PUT /backup/config
**Route Name:** update_backup_config
**Summary:** None

Update backup system configuration.

Allows updating backup settings like retention period,
compression level, and scheduling.

Update backup system configuration.

    Allows updating backup settings like retention period,
    compression level, and scheduling.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /backup/health
**Route Name:** backup_health_check
**Summary:** None

Health check for backup service components

Health check for backup service components

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### CASES Router
**Endpoints:** 5
**Tags:** None

#### GET /{case_id}
**Route Name:** get_case
**Summary:** None

Get a specific case

Get a specific case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### PUT /{case_id}
**Route Name:** update_case
**Summary:** None

Update a case

Update a case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /{case_id}
**Route Name:** delete_case
**Summary:** None

Delete a case

Delete a case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /{case_id}/notes
**Route Name:** add_case_note
**Summary:** None

Add a note to a case

Add a note to a case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /{case_id}/notes
**Route Name:** get_case_notes
**Summary:** None

Get notes for a case

Get notes for a case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### COLLABORATION Router
**Endpoints:** 5
**Tags:** None

Collaboration API Router
Provides REST endpoints for collaboration management

#### GET /sessions
**Route Name:** get_sessions
**Summary:** None

Get all active collaboration sessions

Get all active collaboration sessions

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sessions/{session_id}
**Route Name:** get_session_info
**Summary:** None

Get information about a specific session

Get information about a specific session

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /stats
**Route Name:** get_collaboration_stats
**Summary:** None

Get collaboration system statistics

Get collaboration system statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /sessions/{session_id}/broadcast
**Route Name:** broadcast_to_session
**Summary:** None

Broadcast a message to all participants in a session

Broadcast a message to all participants in a session

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /sessions/{session_id}/participants/{participant_id}/message
**Route Name:** send_to_participant
**Summary:** None

Send a message to a specific participant

Send a message to a specific participant

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### COMPLIANCE Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.core.auth_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/378x492/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/378x492/backend/app/routers/compliance.py", line 8, in <module>
    from app.services.core.auth_service import auth_service
ModuleNotFoundError: No module named 'app.services.core.auth_service'


### DIAGNOSTICS Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.core.auth_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/378x492/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/378x492/backend/app/routers/diagnostics.py", line 6, in <module>
    from app.services.core.auth_service import auth_service
ModuleNotFoundError: No module named 'app.services.core.auth_service'


### EVIDENCE Router
**Endpoints:** 5
**Tags:** None

#### GET /evidence
**Route Name:** get_evidence
**Summary:** Get list of evidence items with pagination and search

**Description:** Retrieves a paginated list of evidence items. Supports server-side search by filename or uploader.

**Parameters:**
- `case_id` (str, optional): Filter by case ID
- `file_type` (str, optional): Filter by file type
- `page` (int, default: 1): Page number
- `page_size` (int, default: 20): Items per page
- `q` (str, optional): Search query for filename/uploader

**Responses:**
- `200`: Success (Returns `{ "items": [], "total": 0, "page": 1, "page_size": 20 }`)
- `401`: Unauthorized

---

#### GET /evidence/{evidence_id}/highlights
**Route Name:** get_evidence_highlights
**Summary:** Get forensic highlights for a document

**Description:** Retrieves all saved highlights and forensic notes for a specific evidence item.

**Parameters:**
- `evidence_id` (str): Unique ID of the evidence

**Responses:**
- `200`: Success (Array of highlight objects)
- `404`: Evidence not found

---

#### POST /evidence/{evidence_id}/highlights
**Route Name:** save_evidence_highlight
**Summary:** Add a forensic highlight to a document

**Description:** Persists a new text or area highlight, including forensic notes and creator metadata.

**Parameters:**
- `evidence_id` (str): Unique ID of the evidence
- `body` (JSON): Highlight object (position, content, comment)

**Responses:**
- `200`: Success
- `404`: Evidence not found

---

#### GET /evidence/{evidence_id}/download
**Route Name:** download_evidence
**Summary:** None

Download evidence file

Download evidence file

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /evidence/processing/metrics
**Route Name:** get_evidence_processing_metrics
**Summary:** None

Get evidence processing performance metrics

Get evidence processing performance metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /evidence/processing/cleanup
**Route Name:** cleanup_evidence_processor
**Summary:** None

Clean up evidence processor resources

Clean up evidence processor resources

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /evidence/upload
**Route Name:** upload_evidence
**Summary:** None

Upload and process evidence file for a case

This endpoint:
1. Saves the uploaded file
2. Performs multi-modal analysis (OCR, forensics, etc.)
3. Creates evidence record in database
4. Indexes content for search

Upload and process evidence file for a case

    This endpoint:
    1. Saves the uploaded file
    2. Performs multi-modal analysis (OCR, forensics, etc.)
    3. Creates evidence record in database
    4. Indexes content for search

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### FRAUD Router
**Endpoints:** 4
**Tags:** None

#### POST /analyze/{case_id}
**Route Name:** analyze_case
**Summary:** None

Analyze a case for fraud patterns

Analyze a case for fraud patterns

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /alerts/{case_id}
**Route Name:** get_case_alerts
**Summary:** None

Get all fraud alerts for a case

Get all fraud alerts for a case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### PUT /alerts/{alert_id}/status
**Route Name:** update_alert_status
**Summary:** None

Update the status of a fraud alert

Update the status of a fraud alert

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /stats
**Route Name:** get_fraud_stats
**Summary:** None

Get fraud detection statistics

Get fraud detection statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### FRAUD_RULES Router
**Endpoints:** 8
**Tags:** None

Fraud Rules Engine API Router
Provides endpoints for managing and using fraud detection rules

#### POST /evaluate
**Route Name:** evaluate_transaction
**Summary:** None

Evaluate a transaction for fraud

Returns fraud risk assessment and recommendations

Evaluate a transaction for fraud

    Returns fraud risk assessment and recommendations

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /rules
**Route Name:** list_rules
**Summary:** None

Get all fraud detection rules

Get all fraud detection rules

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /rules/{rule_id}
**Route Name:** get_rule
**Summary:** None

Get specific rule details

Get specific rule details

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### PATCH /rules/{rule_id}/toggle
**Route Name:** toggle_rule
**Summary:** None

Enable or disable a rule

Enable or disable a rule

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /rules
**Route Name:** create_rule
**Summary:** None

Create a new fraud detection rule

Create a new fraud detection rule

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /rules/{rule_id}
**Route Name:** delete_rule
**Summary:** None

Delete a fraud detection rule

Delete a fraud detection rule

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /stats
**Route Name:** get_engine_stats
**Summary:** None

Get fraud detection engine statistics

Get fraud detection engine statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /batch-evaluate
**Route Name:** batch_evaluate_transactions
**Summary:** None





**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### GRAPH Router
**Endpoints:** 14
**Tags:** relationship-graph

#### POST /graph/snapshot/{case_id}
**Route Name:** save_graph_snapshot
**Summary:** None

Save a graph snapshot for a case

Save a graph snapshot for a case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/snapshots/{case_id}
**Route Name:** get_graph_snapshots
**Summary:** None

Get all graph snapshots for a case

Get all graph snapshots for a case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/snapshot/{snapshot_id}
**Route Name:** get_graph_snapshot
**Summary:** None

Get a specific graph snapshot by ID

Get a specific graph snapshot by ID

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /graph/build
**Route Name:** build_relationship_graph
**Summary:** None

Build relationship graph from transaction data

Build relationship graph from transaction data

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/data
**Route Name:** get_graph_data
**Summary:** None

Get current graph data for visualization

Get current graph data for visualization

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/communities
**Route Name:** detect_communities
**Summary:** None

Detect communities in the relationship graph

Detect communities in the relationship graph

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/central-entities
**Route Name:** get_central_entities
**Summary:** None

Get most central entities in the graph

Get most central entities in the graph

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/suspicious-patterns
**Route Name:** get_suspicious_patterns
**Summary:** None

Find suspicious patterns in the relationship graph

Find suspicious patterns in the relationship graph

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/entity/{entity_id}
**Route Name:** get_entity_details
**Summary:** None

Get detailed information about a specific entity

Get detailed information about a specific entity

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/path/{source}/{target}
**Route Name:** find_shortest_path
**Summary:** None

Find shortest path between two entities

Find shortest path between two entities

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/export/{format}
**Route Name:** export_graph
**Summary:** None

Export graph data in specified format

Export graph data in specified format

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /graph/clear
**Route Name:** clear_graph
**Summary:** None

Clear the current relationship graph

Clear the current relationship graph

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/search
**Route Name:** search_graph
**Summary:** None

Search for nodes in the graph

Search for nodes in the graph

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /graph/{case_id}/correlations
**Route Name:** get_metadata_correlations
**Summary:** None

Get all metadata correlations for a case

Get all metadata correlations for a case

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### HEALTH Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** invalid syntax (health.py, line 2)
Traceback (most recent call last):
  File "/Users/Arief/Desktop/378x492/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 936, in exec_module
  File "<frozen importlib._bootstrap_external>", line 1074, in get_code
  File "<frozen importlib._bootstrap_external>", line 1004, in source_to_code
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/378x492/backend/app/routers/health.py", line 2
    <<<<<<< Updated upstream
    ^^
SyntaxError: invalid syntax


### IDENTITY Router
**Endpoints:** 11
**Tags:** None

Identity Router - Consolidated Authentication & User Management
Combines auth.py, users.py, webauthn.py, and onboarding.py

#### POST /auth/login
**Route Name:** login
**Summary:** None

Authenticate user and return JWT tokens

Authenticate user and return JWT tokens

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /auth/mfa/setup
**Route Name:** mfa_setup
**Summary:** None

Generate MFA secret and QR code URI for setup

Generate MFA secret and QR code URI for setup

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /auth/mfa/verify
**Route Name:** mfa_verify
**Summary:** None

Verify MFA code and enable MFA for the account

Verify MFA code and enable MFA for the account

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### PUT /users/me/preferences
**Route Name:** update_user_preferences
**Summary:** None

Update current user preferences

Update current user preferences

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /users
**Route Name:** get_users
**Summary:** None

Get users with optional filtering

Get users with optional filtering

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /users/{user_id}
**Route Name:** get_user
**Summary:** None

Get user by ID

Get user by ID

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /webauthn/status
**Route Name:** get_webauthn_status
**Summary:** None

Get WebAuthn availability status

Get WebAuthn availability status

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /webauthn/register/options
**Route Name:** get_registration_options
**Summary:** None

Get WebAuthn registration options

Get WebAuthn registration options

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /webauthn/register/verify
**Route Name:** verify_registration
**Summary:** None

Verify WebAuthn registration response

Verify WebAuthn registration response

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /onboarding/roles
**Route Name:** get_roles
**Summary:** None

Return supported roles for role selection wizard

Return supported roles for role selection wizard

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /onboarding/rookie-checklist
**Route Name:** submit_rookie_checklist
**Summary:** None

Validate and persist rookie checklist

Validate and persist rookie checklist

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### INTELLIGENCE Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** cannot import name 'FraudAlert' from 'app.services.intelligence' (/Users/Arief/Desktop/378x492/backend/app/services/intelligence/__init__.py)
Traceback (most recent call last):
  File "/Users/Arief/Desktop/378x492/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/378x492/backend/app/routers/intelligence.py", line 19, in <module>
    from app.services.intelligence import (
ImportError: cannot import name 'FraudAlert' from 'app.services.intelligence' (/Users/Arief/Desktop/378x492/backend/app/services/intelligence/__init__.py)


### LOGGING Router
**Endpoints:** 13
**Tags:** logging-telemetry

#### GET /logging/status
**Route Name:** get_logging_status
**Summary:** None

Get current logging status and configuration

Returns:
    Logging system status

Get current logging status and configuration

    Returns:
        Logging system status

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /logging/telemetry
**Route Name:** get_telemetry_data
**Summary:** None

Get current telemetry data

Returns:
    Telemetry statistics and metrics

Get current telemetry data

    Returns:
        Telemetry statistics and metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /logging/telemetry/reset
**Route Name:** reset_telemetry
**Summary:** None

Reset telemetry data

Returns:
    Reset result

Reset telemetry data

    Returns:
        Reset result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /logging/telemetry/export
**Route Name:** export_telemetry
**Summary:** None

Export telemetry data to file

Args:
    file_path: Optional file path for export

Returns:
    Export result

Export telemetry data to file

    Args:
        file_path: Optional file path for export

    Returns:
        Export result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /logging/log
**Route Name:** create_log_entry
**Summary:** None

Create a structured log entry

Args:
    level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    category: Log category
    message: Log message
    user_id: User ID
    session_id: Session ID
    request_id: Request ID
    ip_address: IP address
    user_agent: User agent
    metadata: Additional metadata
    duration_ms: Duration in milliseconds
    error_code: Error code

Returns:
    Log creation result

Create a structured log entry

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        category: Log category
        message: Log message
        user_id: User ID
        session_id: Session ID
        request_id: Request ID
        ip_address: IP address
        user_agent: User agent
        metadata: Additional metadata
        duration_ms: Duration in milliseconds
        error_code: Error code

    Returns:
        Log creation result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /logging/log/user-action
**Route Name:** log_user_action
**Summary:** None

Log user action for telemetry

Args:
    action: User action description
    user_id: User ID
    metadata: Additional metadata

Returns:
    Log creation result

Log user action for telemetry

    Args:
        action: User action description
        user_id: User ID
        metadata: Additional metadata

    Returns:
        Log creation result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /logging/log/api-request
**Route Name:** log_api_request
**Summary:** None

Log API request for performance monitoring

Args:
    method: HTTP method
    endpoint: API endpoint
    status_code: HTTP status code
    duration_ms: Request duration in milliseconds
    user_id: User ID
    metadata: Additional metadata

Returns:
    Log creation result

Log API request for performance monitoring

    Args:
        method: HTTP method
        endpoint: API endpoint
        status_code: HTTP status code
        duration_ms: Request duration in milliseconds
        user_id: User ID
        metadata: Additional metadata

    Returns:
        Log creation result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /logging/log/security-event
**Route Name:** log_security_event
**Summary:** None

Log security event

Args:
    event_type: Security event type
    severity: Event severity
    user_id: User ID
    metadata: Additional metadata

Returns:
    Log creation result

Log security event

    Args:
        event_type: Security event type
        severity: Event severity
        user_id: User ID
        metadata: Additional metadata

    Returns:
        Log creation result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /logging/log/performance-metric
**Route Name:** log_performance_metric
**Summary:** None

Log performance metric

Args:
    metric_name: Metric name
    value: Metric value
    unit: Metric unit
    metadata: Additional metadata

Returns:
    Log creation result

Log performance metric

    Args:
        metric_name: Metric name
        value: Metric value
        unit: Metric unit
        metadata: Additional metadata

    Returns:
        Log creation result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /logging/logs/search
**Route Name:** search_logs
**Summary:** None

Search log entries (simplified implementation)

Args:
    level: Filter by log level
    category: Filter by log category
    user_id: Filter by user ID
    session_id: Filter by session ID
    start_time: Start time filter
    end_time: End time filter
    limit: Maximum number of results

Returns:
    Search results

Search log entries (simplified implementation)

    Args:
        level: Filter by log level
        category: Filter by log category
        user_id: Filter by user ID
        session_id: Filter by session ID
        start_time: Start time filter
        end_time: End time filter
        limit: Maximum number of results

    Returns:
        Search results

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /logging/pii-scrubbing/test
**Route Name:** test_pii_scrubbing
**Summary:** None

Test PII scrubbing on sample text

Args:
    text: Text to test PII scrubbing

Returns:
    PII scrubbing test results

Test PII scrubbing on sample text

    Args:
        text: Text to test PII scrubbing

    Returns:
        PII scrubbing test results

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /logging/config
**Route Name:** get_logging_config
**Summary:** None

Get current logging configuration

Returns:
    Logging configuration

Get current logging configuration

    Returns:
        Logging configuration

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### PUT /logging/config
**Route Name:** update_logging_config
**Summary:** None

Update logging configuration (simplified implementation)

Args:
    config: New logging configuration

Returns:
    Configuration update result

Update logging configuration (simplified implementation)

    Args:
        config: New logging configuration

    Returns:
        Configuration update result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### METADATA Router
**Endpoints:** 5
**Tags:** metadata

Metadata Extraction API Endpoints

Exposes EXIF-like metadata extraction for documents.

#### POST /metadata/extract
**Route Name:** extract_metadata
**Summary:** None

Extract EXIF-like metadata from an uploaded document.

Supports:
- PDF files
- Images (JPEG, PNG, TIFF)
- Office documents (DOCX)

Returns complete metadata including forensic flags.

Extract EXIF-like metadata from an uploaded document.

    Supports:
    - PDF files
    - Images (JPEG, PNG, TIFF)
    - Office documents (DOCX)

    Returns complete metadata including forensic flags.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /metadata/hash/{file_id}
**Route Name:** get_file_hash
**Summary:** None

Get hash values for a previously processed file.

Used for chain of custody verification.

Get hash values for a previously processed file.

    Used for chain of custody verification.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /metadata/compare
**Route Name:** compare_documents
**Summary:** None

Compare two documents and detect discrepancies.

Returns:
- hash_match: Whether content is identical
- discrepancies: List of differing fields
- tamper_indicators: Signs of potential tampering
- risk_score: 0-100 risk assessment

Compare two documents and detect discrepancies.

    Returns:
    - hash_match: Whether content is identical
    - discrepancies: List of differing fields
    - tamper_indicators: Signs of potential tampering
    - risk_score: 0-100 risk assessment

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /metadata/forensic-scan
**Route Name:** forensic_scan
**Summary:** None

Perform deep forensic analysis on a document.

Checks for:
- Metadata inconsistencies
- Editing software signatures
- Modification patterns
- Missing expected data

Perform deep forensic analysis on a document.

    Checks for:
    - Metadata inconsistencies
    - Editing software signatures
    - Modification patterns
    - Missing expected data

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /metadata/supported-types
**Route Name:** get_supported_types
**Summary:** None

List all supported document types for metadata extraction.

List all supported document types for metadata extraction.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### METRICS Router
**Endpoints:** 2
**Tags:** None

Backend Metrics Endpoint
Exposes Prometheus-compatible metrics for monitoring

#### GET /metrics
**Route Name:** metrics
**Summary:** None

Prometheus metrics endpoint
Returns metrics in Prometheus text format

Prometheus metrics endpoint
    Returns metrics in Prometheus text format

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /health/detailed
**Route Name:** detailed_health
**Summary:** None

Detailed health check with system metrics

Detailed health check with system metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### MULTIMODAL Router
**Endpoints:** 5
**Tags:** multi-modal-analysis

#### POST /analyze/upload
**Route Name:** analyze_uploaded_file
**Summary:** None

Analyze uploaded file with multi-modal analysis

Analyze uploaded file with multi-modal analysis

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /analyze/path
**Route Name:** analyze_file_path
**Summary:** None

Analyze file at specified path with multi-modal analysis

Analyze file at specified path with multi-modal analysis

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /analyze/batch
**Route Name:** analyze_batch_files
**Summary:** None

Analyze multiple uploaded files with multi-modal analysis

Analyze multiple uploaded files with multi-modal analysis

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /capabilities
**Route Name:** get_analysis_capabilities
**Summary:** None

Get available analysis capabilities

Get available analysis capabilities

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /status
**Route Name:** get_analysis_status
**Summary:** None

Get status of multi-modal analysis service

Get status of multi-modal analysis service

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### NOTIFICATIONS Router
**Endpoints:** 9
**Tags:** notifications

#### GET /notifications/
**Route Name:** get_notifications
**Summary:** None

Get notifications for a user

Get notifications for a user

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /notifications/{notification_id}/read
**Route Name:** mark_notification_read
**Summary:** None

Mark a notification as read

Mark a notification as read

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /notifications/mark-all-read
**Route Name:** mark_all_notifications_read
**Summary:** None

Mark all notifications as read for a user

Mark all notifications as read for a user

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /notifications/trigger
**Route Name:** trigger_notification
**Summary:** None

Manually trigger a notification event

Manually trigger a notification event

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /notifications/stats
**Route Name:** get_notification_stats
**Summary:** None

Get notification system statistics

Get notification system statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /notifications/test
**Route Name:** test_notification
**Summary:** None

Send a test notification

Send a test notification

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /notifications/clear
**Route Name:** clear_notifications
**Summary:** None

Clear all notifications for a user

Clear all notifications for a user

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /notifications/types
**Route Name:** get_notification_types
**Summary:** None

Get available notification types

Get available notification types

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /notifications/channels
**Route Name:** get_notification_channels
**Summary:** None

Get available notification channels

Get available notification channels

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### ONBOARDING Router
**Endpoints:** 2
**Tags:** onboarding

DEPRECATED: This module is deprecated. The functionality has been consolidated into backend/app/routers/identity.py.
Please use the onboarding endpoints provided in backend/app/routers/identity.py instead.

#### GET /roles
**Route Name:** get_roles
**Summary:** None

Return a list of supported roles for the role selection wizard.

Return a list of supported roles for the role selection wizard.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /rookie-checklist
**Route Name:** submit_rookie_checklist
**Summary:** None

Validate and persist the rookie checklist submission to the DB.

Returns a lightweight acceptance response for integration tests.

Validate and persist the rookie checklist submission to the DB.

    Returns a lightweight acceptance response for integration tests.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### PHASE6B Router
**Endpoints:** 2
**Tags:** None

#### POST /phase6b/metadata-correlation
**Route Name:** metadata_correlation
**Summary:** None





**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /phase6b/temporal-burst
**Route Name:** temporal_burst
**Summary:** None





**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### PROOF Router
**Endpoints:** 9
**Tags:** fraud-proof

Proof API Router

Provides endpoints for fraud proof mechanisms that generate court-admissible evidence:
- Metadata correlation detection
- Temporal burst pattern analysis
- Immutable audit chain verification
- Shell network/community detection

#### GET /proof/metadata-correlations/{case_id}
**Route Name:** get_metadata_correlations
**Summary:** None

Get metadata correlations for a case.

Detects relationships between entities via shared metadata:
- Same phone number
- Same email address
- Same physical address
- Same IP address

Returns:
    Correlation results with confidence scores

Get metadata correlations for a case.

    Detects relationships between entities via shared metadata:
    - Same phone number
    - Same email address
    - Same physical address
    - Same IP address

    Returns:
        Correlation results with confidence scores

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /proof/temporal-bursts/{case_id}
**Route Name:** detect_temporal_bursts
**Summary:** None

Detect temporal burst patterns in case transactions.

Patterns detected:
- Burst: Rapid transaction sequences (10+ in 48 hours default)
- Structuring: Amounts clustering below reporting threshold
- Velocity: Sudden increases in transaction frequency

Returns:
    Burst analysis results with alerts and risk scores

Detect temporal burst patterns in case transactions.

    Patterns detected:
    - Burst: Rapid transaction sequences (10+ in 48 hours default)
    - Structuring: Amounts clustering below reporting threshold
    - Velocity: Sudden increases in transaction frequency

    Returns:
        Burst analysis results with alerts and risk scores

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /proof/temporal-bursts/analyze
**Route Name:** analyze_transactions_for_bursts
**Summary:** None

Analyze provided transactions for temporal burst patterns.

Useful for ad-hoc analysis without a case context.

Args:
    transactions: List of transaction dictionaries with date, amount, customer_id

Returns:
    Burst analysis results

Analyze provided transactions for temporal burst patterns.

    Useful for ad-hoc analysis without a case context.

    Args:
        transactions: List of transaction dictionaries with date, amount, customer_id

    Returns:
        Burst analysis results

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /proof/audit-chain/verify
**Route Name:** verify_audit_chain
**Summary:** None

Verify the integrity of the immutable audit chain.

Checks:
- Chain linkage (each entry links to previous)
- HMAC signatures validity
- Data hash integrity

Returns:
    Verification result with status and any detected issues

Verify the integrity of the immutable audit chain.

    Checks:
    - Chain linkage (each entry links to previous)
    - HMAC signatures validity
    - Data hash integrity

    Returns:
        Verification result with status and any detected issues

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /proof/audit-chain/export
**Route Name:** export_audit_chain_proof
**Summary:** None

Export chain proof for court-admissible evidence.

Generates a cryptographically signed proof document containing:
- Filtered audit entries
- Chain verification data
- HMAC proof signature

Returns:
    Court-ready proof document

Export chain proof for court-admissible evidence.

    Generates a cryptographically signed proof document containing:
    - Filtered audit entries
    - Chain verification data
    - HMAC proof signature

    Returns:
        Court-ready proof document

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /proof/audit-chain/stats
**Route Name:** get_audit_chain_stats
**Summary:** None

Get audit chain statistics

Get audit chain statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /proof/audit-chain/append
**Route Name:** append_audit_entry
**Summary:** None

Append a new entry to the immutable audit chain.

This creates a cryptographically linked entry with:
- Link to previous entry (previous_hash)
- HMAC signature
- Data hash

Append a new entry to the immutable audit chain.

    This creates a cryptographically linked entry with:
    - Link to previous entry (previous_hash)
    - HMAC signature
    - Data hash

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /proof/community-detection/{case_id}
**Route Name:** detect_shell_networks
**Summary:** None

Detect potential shell company networks in case data.

Uses Louvain community detection to identify:
- Tight-knit transaction clusters
- Circular transaction patterns
- Entities with high internal transaction ratios

Returns:
    Detected shell networks with risk scoring

Detect potential shell company networks in case data.

    Uses Louvain community detection to identify:
    - Tight-knit transaction clusters
    - Circular transaction patterns
    - Entities with high internal transaction ratios

    Returns:
        Detected shell networks with risk scoring

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /proof/summary/{case_id}
**Route Name:** get_proof_summary
**Summary:** None

Get combined proof visualization data for a case.

Aggregates all proof mechanisms into a single dashboard-ready response:
- Metadata correlation summary
- Temporal burst summary
- Audit chain status
- Shell network summary

Returns:
    Combined proof summary with confidence scores

Get combined proof visualization data for a case.

    Aggregates all proof mechanisms into a single dashboard-ready response:
    - Metadata correlation summary
    - Temporal burst summary
    - Audit chain status
    - Shell network summary

    Returns:
        Combined proof summary with confidence scores

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### REALTIME_SYNC Router
**Endpoints:** 8
**Tags:** realtime-sync

####  /sync/ws/{user_id}
**Route Name:** websocket_endpoint
**Summary:** 



WebSocket endpoint for real-time collaboration

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sync/status
**Route Name:** get_service_status
**Summary:** None

Get sync service status

Get sync service status

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sync/documents
**Route Name:** get_documents
**Summary:** None

Get list of all collaborative documents

Get list of all collaborative documents

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sync/documents/{document_id}
**Route Name:** get_document
**Summary:** None

Get specific document details

Get specific document details

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /sync/documents/{document_id}/operations
**Route Name:** create_operation
**Summary:** None

Create and apply an operation to a document (HTTP fallback)

Create and apply an operation to a document (HTTP fallback)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sync/stats
**Route Name:** get_sync_stats
**Summary:** None

Get real-time sync statistics

Get real-time sync statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /sync/broadcast
**Route Name:** broadcast_message
**Summary:** None

Broadcast message to all connected clients

Broadcast message to all connected clients

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /sync/documents/{document_id}
**Route Name:** delete_document
**Summary:** None

Delete a collaborative document

Delete a collaborative document

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### RECONCILIATION Router
**Endpoints:** 8
**Tags:** reconciliation

#### GET /items
**Route Name:** get_reconciliation_items
**Summary:** None

Get list of items for reconciliation view.

Get list of items for reconciliation view.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /cash-float
**Route Name:** analyze_cash_float
**Summary:** None

Reconcile a cash float for a specific entity over a time period.

Reconcile a cash float for a specific entity over a time period.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /batch-match
**Route Name:** find_batch_matches
**Summary:** None

Find expenses that match a specific withdrawal amount.

Find expenses that match a specific withdrawal amount.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /temporal-analysis
**Route Name:** analyze_temporal_anomalies
**Summary:** None

Check for temporal anomalies in a specific set of transactions.

Check for temporal anomalies in a specific set of transactions.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /batch/save
**Route Name:** save_batch_match
**Summary:** None

Persist a batch match by linking expenses to a withdrawal.

Persist a batch match by linking expenses to a withdrawal.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /batch/analyze-sequence
**Route Name:** analyze_sequence_anomalies
**Summary:** None

Check for sequence anomalies (backdating) in a batch.

Check for sequence anomalies (backdating) in a batch.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /reconcile/{transaction_id}
**Route Name:** mark_reconciled
**Summary:** None

Mark a transaction as reconciled

Mark a transaction as reconciled

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /flag/{transaction_id}
**Route Name:** flag_discrepancy
**Summary:** None

Flag a transaction discrepancy

Flag a transaction discrepancy

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### REPORTING Router
**Endpoints:** 11
**Tags:** None

#### GET /analytics/cases
**Route Name:** get_case_analytics
**Summary:** None

Get aggregated analytics for all cases.

Get aggregated analytics for all cases.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /analytics/transactions
**Route Name:** get_transaction_analytics
**Summary:** None

Get aggregated analytics for transactions.

Get aggregated analytics for transactions.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /analytics/overview
**Route Name:** get_system_overview
**Summary:** None

Get high-level system overview statistics.

Get high-level system overview statistics.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /reporting/export
**Route Name:** generate_report
**Summary:** None

Generate a report based on provided criteria.
Returns a download URL.

Generate a report based on provided criteria.
    Returns a download URL.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /reporting/summary/{case_id}
**Route Name:** get_case_summary
**Summary:** None

Get comprehensive summary statistics and findings for a case.
Used by the Summary Preview tab in the Reporting page.

Get comprehensive summary statistics and findings for a case.
    Used by the Summary Preview tab in the Reporting page.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /reporting/templates
**Route Name:** get_report_templates
**Summary:** None

Get available report templates with their metadata.

Get available report templates with their metadata.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /reporting/scheduled
**Route Name:** get_scheduled_reports
**Summary:** None

Get list of configured scheduled reports.

Get list of configured scheduled reports.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /reporting/scheduled
**Route Name:** create_scheduled_report
**Summary:** None

Create a new scheduled report configuration.

Create a new scheduled report configuration.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /reporting/scheduled/{schedule_id}
**Route Name:** delete_scheduled_report
**Summary:** None

Delete a scheduled report configuration.

Delete a scheduled report configuration.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /reporting/financial-health/{case_id}
**Route Name:** get_financial_health
**Summary:** None

Get financial health data for the FinancialHealth component.
Includes cashflow waterfall and burn rate data.

Get financial health data for the FinancialHealth component.
    Includes cashflow waterfall and burn rate data.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /reporting/project-tracker/{case_id}
**Route Name:** get_project_tracker
**Summary:** None

Get project milestone and benchmark data for the ProjectTracker component.

Get project milestone and benchmark data for the ProjectTracker component.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### SEARCH Router
**Endpoints:** 4
**Tags:** None

#### POST /evidence/search
**Route Name:** search_evidence
**Summary:** None

Search processed evidence content

Search processed evidence content

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /evidence/search/stats
**Route Name:** get_evidence_search_stats
**Summary:** None

Get statistics about indexed evidence

Get statistics about indexed evidence

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /evidence/search/semantic
**Route Name:** semantic_search_evidence
**Summary:** None

Perform semantic search on evidence content

Perform semantic search on evidence content

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /evidence/search/semantic/stats
**Route Name:** get_semantic_search_stats
**Summary:** None

Get statistics about the semantic search vector store

Get statistics about the semantic search vector store

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### SEMANTIC_SEARCH Router
**Endpoints:** 8
**Tags:** semantic-search

#### POST /semantic-search/index
**Route Name:** index_document
**Summary:** None

Index a document for semantic search

Args:
    document_id: Unique document identifier
    content: Document content to index
    metadata: Additional metadata
    backend: Vector store backend to use

Returns:
    Indexing result

Index a document for semantic search

    Args:
        document_id: Unique document identifier
        content: Document content to index
        metadata: Additional metadata
        backend: Vector store backend to use

    Returns:
        Indexing result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /semantic-search/index/batch
**Route Name:** index_batch_documents
**Summary:** None

Index multiple documents for semantic search

Args:
    documents: List of documents to index
    backend: Vector store backend to use

Returns:
    Batch indexing results

Index multiple documents for semantic search

    Args:
        documents: List of documents to index
        backend: Vector store backend to use

    Returns:
        Batch indexing results

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /semantic-search/search
**Route Name:** search_documents
**Summary:** None

Perform semantic search on indexed documents

Args:
    query: Search query
    limit: Maximum number of results
    threshold: Minimum similarity threshold
    backend: Vector store backend to use
    filters: JSON metadata filters

Returns:
    Search results

Perform semantic search on indexed documents

    Args:
        query: Search query
        limit: Maximum number of results
        threshold: Minimum similarity threshold
        backend: Vector store backend to use
        filters: JSON metadata filters

    Returns:
        Search results

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /semantic-search/index/{document_id}
**Route Name:** delete_document
**Summary:** None

Delete a document from the semantic index

Args:
    document_id: Document ID to delete
    backend: Vector store backend to use

Returns:
    Deletion result

Delete a document from the semantic index

    Args:
        document_id: Document ID to delete
        backend: Vector store backend to use

    Returns:
        Deletion result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /semantic-search/stats
**Route Name:** get_search_stats
**Summary:** None

Get statistics about the semantic search engine

Args:
    backend: Vector store backend to query

Returns:
    Search engine statistics

Get statistics about the semantic search engine

    Args:
        backend: Vector store backend to query

    Returns:
        Search engine statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /semantic-search/rebuild
**Route Name:** rebuild_index
**Summary:** None

Rebuild the semantic search index

Args:
    backend: Vector store backend to rebuild

Returns:
    Rebuild result

Rebuild the semantic search index

    Args:
        backend: Vector store backend to rebuild

    Returns:
        Rebuild result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /semantic-search/backends
**Route Name:** get_available_backends
**Summary:** None

Get available vector store backends

Returns:
    List of available backends and their capabilities

Get available vector store backends

    Returns:
        List of available backends and their capabilities

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /semantic-search/switch-backend
**Route Name:** switch_backend
**Summary:** None

Switch to a different vector store backend

Args:
    backend: New backend to use
    config: Backend configuration

Returns:
    Switch result

Switch to a different vector store backend

    Args:
        backend: New backend to use
        config: Backend configuration

    Returns:
        Switch result

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### STATS Router
**Endpoints:** 3
**Tags:** None

#### GET /locations
**Route Name:** get_threat_map_locations
**Summary:** None

Returns real-time threat map data points based on actual transaction locations.

Geocodes flagged transactions and blocked transactions to provide accurate
geographic visualization of fraud patterns.

Returns real-time threat map data points based on actual transaction locations.

    Geocodes flagged transactions and blocked transactions to provide accurate
    geographic visualization of fraud patterns.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /metrics
**Route Name:** get_dashboard_metrics
**Summary:** None

Returns aggregated dashboard KPIs from actual database and monitoring service

Returns aggregated dashboard KPIs from actual database and monitoring service

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /predictive
**Route Name:** get_predictive_analytics
**Summary:** None

Returns predictive intelligence stats.
Currently mocks the ML model output but uses real time windows.

Returns predictive intelligence stats.
    Currently mocks the ML model output but uses real time windows.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### STREAMING Router
**Endpoints:** 3
**Tags:** None

Server-Sent Events (SSE) Streaming for AI Responses
Enables token-by-token streaming of AI responses to frontend

#### POST /ai/stream
**Route Name:** stream_ai_response
**Summary:** None

Stream AI response using Server-Sent Events

Request body:
{
    "message": "User message",
    "context": {
        "caseId": "optional",
        "persona": "frenly|skeptical|thorough"
    }
}

Stream AI response using Server-Sent Events

    Request body:
    {
        "message": "User message",
        "context": {
            "caseId": "optional",
            "persona": "frenly|skeptical|thorough"
        }
    }

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /ai/analyze/stream
**Route Name:** stream_transaction_analysis
**Summary:** None

Stream transaction analysis results

Request body:
{
    "transaction_id": "txn_123",
    "amount": 15000.00,
    "currency": "USD",
    ...
}

Stream transaction analysis results

    Request body:
    {
        "transaction_id": "txn_123",
        "amount": 15000.00,
        "currency": "USD",
        ...
    }

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /ai/stream/test
**Route Name:** test_stream
**Summary:** None

Test SSE streaming endpoint

Test SSE streaming endpoint

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### USERS Router
**Endpoints:** 3
**Tags:** None

#### PUT /users/me/preferences
**Route Name:** update_user_preferences
**Summary:** None

Update current user preferences

Update current user preferences

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /users
**Route Name:** get_users
**Summary:** None

Get users with optional filtering

Get users with optional filtering

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /users/{user_id}
**Route Name:** get_user
**Summary:** None

Get user by ID

Get user by ID

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### WEBSOCKET Router
**Endpoints:** 3
**Tags:** None

Enhanced WebSocket Handlers
Supports real-time case updates, notifications, and collaboration

####  /ws/case/{case_id}
**Route Name:** websocket_case_endpoint
**Summary:** 



WebSocket endpoint for real-time case updates
    Clients subscribe to specific case changes

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

####  /ws/notifications/{user_id}
**Route Name:** websocket_notifications_endpoint
**Summary:** 



WebSocket endpoint for user notifications
    Real-time alerts, approvals, and system notifications

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

####  /ws/collaboration/{session_id}
**Route Name:** websocket_collaboration_endpoint
**Summary:** 



WebSocket endpoint for real-time collaboration
    Supports cursor positions, edits, and presence

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

