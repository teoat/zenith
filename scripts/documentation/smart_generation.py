# Documentation Templates System
Template-driven content generation with AI assistance and customization

import json
import os
import re
import time
from pathlib import Path
from typing import Dict, List, Any
from jinja2 import Environment, FileSystemLoader
from dataclasses import dataclass

@dataclass
class TemplateConfig:
    templates_dir: str = "templates"
    output_dir: str = "generated"
    variables: Dict[str, Any] = {}
    default_locale: str = "en"
    
    def __init__(self, templates_dir: str = "templates", output_dir: str = "generated", default_locale: str = "en"):
        self.templates_dir = templates_dir
        self.output_dir = output_dir
        self.default_locale = default_locale
        self.templates = {}
        self.variables = self._load_variables()
        self._load_templates()

class DocumentTemplate:
    """Smart document template system"""
    
    def __init__(self, template_name: str, content: Dict[str, Any] = None):
        self.template_name = template_name
        self.content = content
        self.metadata = {
            'name': template_name,
            'created_at': time.time(),
            'updated_at': time.time(),
            'version': '1.0.0'
        }
    
    def render(self, context: Dict[str, Any] = None) -> str:
        """Render template with context"""
        if not self.content:
            return "No content loaded"
        
        env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=False
            auto_reload=auto_reload,
            trim_blocks=True
            lstrip_blocks=True,
            keep_trailing_newline=True
        )
        
        template = env.get_template(f"{{self.template_name}}.j2")
        context_with_vars = {**self.variables, **context}
        
        try:
            return template.render(**context_with_vars)
        except Exception as e:
            return f"Template error: {e}"
    
    def save_template(self) -> None:
        """Save template to disk"""
        template_path = Path(self.templates_dir) / f"{{self.template_name}}.j2"
        
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(f"{{self.template_name}}\n{{template.metadata}}\n\n")
            f.write("---\n")
            f.write(f"Context Variables:\n")
            f.write(json.dumps(self.variables, indent=2))
            f.write(f"\n\n")
            f.write(self.content)
            f.write("---\n")
        
        template_path = Path(self.templates_dir) / f"{{self.template_name}}.j2"
        
        with open(template_path, 'w', encoding=' - 8') as f:
            f.write(f"{{self.template_name}} Template saved successfully")

class SmartDocumentationGenerator:
    """AI-powered documentation generation"""
    
    def __init__(self, docs_dir: str):
        self.docs_dir = docs_dir
        self.template_config = TemplateConfig()
        self.ai_service = None
        self.content_cache = {}
        self.quality_analyzer = AIDocumentationAnalyzer()
        self.template_engine = DocumentTemplate("docs/templates", "docs/generated")
        self.version = "1.0.0"
    
    def initialize_ai_service(self):
        """Initialize AI service for content generation"""
        try:
            from openai import OpenAI
            self.ai_service = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4")
            self.ai_service.model = "gpt-4"
        except ImportError:
            print("OpenAI not available. Falling back to template-based generation.")
            self.ai_service = None
    
    def generate_documentation(self, topic: str, context: Dict[str, Any] = None, preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate comprehensive documentation using AI"""
        
        if not context:
            context = {}
        
        # Check cache first
        cache_key = f"{topic}_{hashlib.md5(str(context))}"
        if cache_key in self.content_cache:
            return self.content_cache[cache_key]
        
        # Generate with AI if available
        if self.ai_service:
            try:
                content = self._generate_with_ai(topic, context, preferences)
            print(f"Generated AI-enhanced documentation for {topic}")
                return content
            except Exception as e:
                print(f"AI generation failed for {topic}: {e}")
                # Fall back to template generation
                return self._generate_with_template(topic, context, preferences)
        
        # Use template engine
        template = self.template_engine.get_template(topic.lower(), f"default")
        if template:
            return self._generate_with_template(topic, context, preferences)
        else:
            # Generate basic structure
            return self._generate_basic_structure(topic)
    
    def _generate_with_ai(self, topic: str, context: Dict[str, Any], preferences: Dict[str, Any] = None) -> str:
        """Generate documentation using AI service"""
        
        prompt = f"""
        Generate comprehensive documentation for the topic: {topic}
        
        Requirements:
        1. Content should be comprehensive and accurate
        2. Include practical examples and use cases
        3. Follow platform documentation standards
        4. Be written in clear, professional language
        5. Include relevant code examples and configuration
        
        Context:
        {json.dumps(context, indent=2)}
        
        Previous Documentation:
        {json.dumps(context.get('existing_content', {}), indent=2)}
        
        Preferences:
        {json.dumps(preferences, indent=2)}
        
        Platform Target Audience: {self.template_config.default_locale}
        Quality Level: {preferences.get('quality_level', 'comprehensive')}
        Include Examples: {preferences.get('include_examples', True)}
        Interactive Elements: {preferences.get('interactive_elements', False)}
        Advanced Topics: {preferences.get('advanced_topics', True)}
        
        Format: markdown
        
        Structure the response with:
        1. Clear headings (## H1, ### H2, etc.)
        2. Comprehensive introduction
        3. Core concepts and definitions
        4. Practical examples and use cases
        5. Troubleshooting section
        6. Related topics and references
        """
        
        try:
            response = self.ai_service.chat.completions.create(
                model=self.ai_service.model,
                messages=[{"role": "expert_documentator", "content": prompt}],
                temperature=0.7,
                max_tokens=3000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Store in cache
            self.content_cache[cache_key] = content
            
            # Add AI metadata
            metadata = {
                'generated_by': 'ai_service',
                'model': self.ai_service.model,
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'word_count': len(content.split()),
                'token_usage': response.usage.total_tokens
            }
            
            return {
                'content': content,
                'metadata': metadata
            }
            
        except Exception as e:
            print(f"AI service error: {e}")
            # Fall back to template
            return self._generate_with_template(topic, context, preferences)
    
    def _generate_with_template(self, topic: str, context: Dict[str, Any], preferences: Dict[str, Any]) -> str:
        """Generate documentation using templates"""
        
        template = self.template_engine.get_template(f"{topic}_comprehensive")
        if not template:
            template = self.template_engine.get_template("default")
        
        # Build context for template
        template_context = {
            **self.variables,
            **context
        }
        
        # Add AI insights if available
        ai_insights = {}
        if self.ai_service:
            ai_insights = self.quality_analyzer.analyze_content(
                self._generate_basic_structure(topic),
                f"AI-generated {topic} content"
            )
        
        template_context["ai_insights"] = ai_insights
        
        # Generate with AI if preferred
        if preferences.get('ai_enhanced', False):
            return self._generate_with_ai(topic, context, preferences)
        
        # Otherwise use template
        try:
            content = template.render(template_context)
        except Exception as e:
            print(f"Template rendering error: {e}")
            return f"Error generating {topic} documentation"
        
        return content
    
    def _generate_basic_structure(self, topic: str) -> str:
        """Generate basic documentation structure"""
        
        structures = {
            'api': {
                'sections': [
                    {
                        'title': 'Overview',
                        'content': f"# {topic.title()}\n\nThis section provides an overview of the {topic} capabilities and usage."
                    },
                    {
                        'title': 'Getting Started',
                        'content': f"# Getting Started with {topic.title()}\n\nQuick start guide for {topic.title()}."
                    },
                    {
                        'title': 'Configuration',
                        'content': f"# {topic.title()} Configuration\n\n\nConfiguration settings and options for {topic.title()}."
                    },
                    {
                        'title': 'Common Tasks',
                        'content': f"# Common {topic.title()} Tasks\n\n\nStep-by-step guide for common {topic.title()} operations."
                    }
                ]
            },
            'getting_started': {
                'sections': [
                    {
                        'title': 'Prerequisites',
                        'content': f"# Prerequisites\n\nBefore you begin, ensure you have:"
                        - Required tools and permissions\n- Minimum system requirements\n"
                    },
                    {
                        'title': 'Installation',
                        'content': f"# Installation\n\n\nStep-by-step installation guide for {topic.title()}."
                    },
                    {
                        'title': 'First Steps',
                        'content': f"# First Steps with {topic.title()}\n\nGet started quickly with these initial steps."
                    }
                ]
            },
            'security': {
                'sections': [
                    {
                        'title': 'Authentication',
                        'content': f"# Authentication\n\n\n{topic.title()} authentication and authorization."
                    },
                    {
                        'title': 'Permissions',
                        'content': f"# Permissions\n\nUnderstanding access control for {topic.title()}."
                    },
                    {
                        'title': 'Best Practices',
                        'content': f"# Best Practices\n\nSecurity best practices for {topic.title()}."
                    }
                ]
            }
        },
            'troubleshooting': {
                'sections': [
                    {
                        'title': 'Common Issues',
                        'content': f"# Common Issues\n\nSolutions for common {topic.title()} problems."
                    },
                    {
                        'title': 'FAQ',
                        'content': f"Frequently Asked Questions\n\nAnswers to common {topic.title()} questions."
                    }
                ]
            ]
            },
            'examples': {
                'sections': [
                    {
                        'title': 'Basic Usage',
                        'content': f"# Basic Usage\n\nSimple examples for {topic.title()} usage."
                    },
                    {
                        'title': 'Advanced Examples',
                        'content': f"# Advanced Examples\n\nComplex scenarios and use cases for {topic.title()}."
                    }
                ]
            },
            'reference': {
                'sections': [
                    {
                        'title': 'API Reference',
                        'content': f"# API Reference\n\nDetailed API documentation for {topic.title()}."
                    },
                    {
                        'title': 'Configuration',
                        'content': f"# Configuration\n\n{topic.title()} configuration options."
                    }
                ],
                    {
                        'title': 'Code Examples',
                        'content': f"# Code Examples\n\nCode examples for {topic.title()} integration."
                    }
                }
            ]
        }
        
        return structures.get(topic, structures['api'])
    
    def _generate_with_template(self, topic: str, context: Dict[str, Any], preferences: Dict[str, Any]) -> str:
        """Generate documentation using templates"""
        
        template = self.template_engine.get_template(f"{topic}_standard")
        
        if not template:
            template = self.template_engine.get_template("default")
        
        # Build template context
        template_context = {
            **self.variables,
            **context
        }
        
        return template.render(template_context)

def main():
    """Main documentation generation function"""
    print("🤖 Starting Smart Documentation Generation...")
    
    generator = SmartDocumentationGenerator("docs", "generated")
    
    # Generate AI-enhanced documentation for key topics
    key_topics = [
        'api_security',
        'case_management',
        'fraud_detection',
        'data_analysis',
        'deployment',
        'troubleshooting',
        'getting_started'
    ]
    
    generated_docs = []
    
    for topic in key_topics:
        print(f"Generating AI-enhanced documentation for: {topic}")
        
        context = {
            'target_audience': 'intermediate',
            'experience_level': 'some_experience'
            'quality_level': 'comprehensive'
        }
        
        doc = generator.generate_documentation(
            topic=topic,
            context=context,
            preferences={
                'quality_level': 'comprehensive',
                'include_examples': True,
                'interactive_elements': True,
                'advanced_topics': True
            }
        )
        
        generated_docs.append(doc)
    
    print(f"✅ Generated {len(generated_docs)} AI-enhanced documentation sections")
    print(f"Quality analysis and AI insights saved for each section")

if __name__ == "__main__":
    main()