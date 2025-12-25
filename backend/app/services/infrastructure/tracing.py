from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor

def setup_opentelemetry(app):
    """
    Sets up OpenTelemetry tracing for the application.
    """
    provider = TracerProvider()
    
    # In a real deployment, we'd use OTLPSpanExporter to send to Jaeger/Tempo
    # exporter = OTLPSpanExporter(endpoint="http://localhost:4317")
    exporter = ConsoleSpanExporter() # For demo/local debugging
    
    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)
    
    trace.set_tracer_provider(provider)
    
    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)
    
    # Instrument Logging
    LoggingInstrumentor().instrument(set_logging_format=True)
    
    return provider
