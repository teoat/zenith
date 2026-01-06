#!/usr/bin/env python3
"""
AI-Powered Quality Analysis & Improvement System
Automated content quality assessment and enhancement
"""

import datetime
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List


@dataclass
class QualityMetrics:
    content_score: float
    readability_score: float
    accuracy_score: float
    completeness_score: float
    consistency_score: float
    grammar_score: float
    structure_score: float
    accessibility_score: float
    overall_grade: str
    issues_found: list[str]
    improvements_suggested: list[str]


class AIDocumentationAnalyzer:
    """AI-powered documentation quality analyzer"""

    def __init__(self):
        self.quality_patterns = self._load_quality_patterns()
        self.ai_rules = self._load_ai_rules()

    def _load_quality_patterns(self) -> dict[str, Any]:
        """Load quality assessment patterns"""
        return {
            "readability_indicators": {
                "sentence_length_avg": 25,
                "paragraph_length_avg": 75,
                "complex_word_ratio": 0.3,
                "passive_voice_ratio": 0.3,
            },
            "structure_indicators": {
                "hierarchy_depth_max": 4,
                "sections_per_document": 5,
                "table_of_contents_required": True,
            },
            "content_quality_indicators": {
                "code_example_coverage": 0.8,
                "error_handling_coverage": 0.9,
                "edge_case_coverage": 0.7,
                "accuracy_level": 0.95,
            },
            "accessibility_indicators": {
                "heading_structure": True,
                "alt_text_coverage": 0.8,
                "link_contrast_ratio": 4.5,
                "keyboard_navigation": True,
            },
        }

    def _load_ai_rules(self) -> dict[str, Any]:
        """Load AI enhancement rules"""
        return {
            "content_generation_rules": {
                "minimum_length": 100,
                "required_sections": [
                    "introduction",
                    "core_concepts",
                    "examples",
                    "troubleshooting",
                ],
                "example_density": 0.1,
                "code_to_content_ratio": 0.3,
            },
            "enhancement_rules": {
                "technical_accuracy": 0.95,
                "practical_relevance": 0.9,
                "clarity_score": 0.9,
                "completeness_threshold": 0.85,
            },
        }

    def analyze_document_quality(self, file_path: Path) -> QualityMetrics:
        """Analyze document quality using AI and heuristics"""

        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()

            # Calculate quality metrics
            metrics = self._calculate_quality_metrics(content)

            # AI-powered analysis
            ai_insights = self._analyze_with_ai(content, file_path.name)

            # Combine metrics
            metrics.issues_found.extend(ai_insights.get("issues", []))
            metrics.improvements_suggested.extend(ai_insights.get("improvements", []))

            return metrics

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")
            return QualityMetrics(
                content_score=0.0,
                readability_score=0.0,
                accuracy_score=0.0,
                completeness_score=0.0,
                consistency_score=0.0,
                grammar_score=0.0,
                structure_score=0.0,
                accessibility_score=0.0,
                overall_grade="F",
                issues_found=[f"Analysis error: {e}"],
                improvements_suggested=[],
            )

    def _calculate_quality_metrics(self, content: str) -> QualityMetrics:
        """Calculate quality metrics from content"""

        metrics = QualityMetrics(
            content_score=50.0,
            readability_score=self._calculate_readability(content),
            accuracy_score=self._calculate_accuracy(content),
            completeness_score=self._calculate_completeness(content),
            consistency_score=self._calculate_consistency(content),
            grammar_score=self._calculate_grammar(content),
            structure_score=self._calculate_structure(content),
            accessibility_score=self._calculate_accessibility(content),
            overall_grade="C",
            issues_found=[],
            improvements_suggested=[],
        )

        # Adjust based on heuristics
        metrics.content_score = self._adjust_content_score(content, metrics)
        metrics.overall_grade = self._calculate_overall_grade(metrics)

        return metrics

    def _calculate_readability(self, content: str) -> float:
        """Calculate readability score"""

        sentences = re.split(r"[.!?]+", content)
        if not sentences:
            return 50.0

        avg_sentence_length = sum(len(s.strip()) for s in sentences) / len(sentences)
        readability_factor = max(
            0,
            (
                25
                - abs(
                    avg_sentence_length
                    - self.quality_patterns["readability_indicators"][
                        "sentence_length_avg"
                    ]
                )
            )
            / 25,
        )

        words = content.split()
        avg_word_length = sum(len(w) for w in words) / len(words)
        complexity_penalty = (
            min(20, len([w for w in words if len(w) > 12]) / len(words)) * 10
        )

        return min(100, max(0, readability_factor * 100 - complexity_penalty))

    def _calculate_accuracy(self, content: str) -> float:
        """Calculate technical accuracy"""

        accuracy_indicators = [
            "api_endpoint_correctness",
            "command_syntax_correctness",
            "code_example_validity",
            "configuration_accuracy",
        ]

        accuracy_score = 85.0  # Base score for existing content
        errors_found = 0

        # Check for common accuracy issues
        if re.search(r"api\.(get|post|put|delete)", content, re.IGNORECASE):
            accuracy_score -= 5
            errors_found += 1

        if re.search(r"(curl|wget|http)", content, re.IGNORECASE):
            # Check if curl examples are properly formatted
            if not re.search(r"\\n\\s{2,}", content):  # Proper indentation
                accuracy_score -= 3
                errors_found += 1

        return max(0, min(100, accuracy_score))

    def _calculate_completeness(self, content: str) -> float:
        """Calculate content completeness"""

        completeness_factors = {
            "introduction_section": "## Introduction" in content,
            "examples_section": "```" in content and "```python" in content,
            "troubleshooting_section": "Troubleshooting" in content,
            "api_reference_section": "API" in content and "Reference" in content,
            "best_practices_section": "Best Practices" in content,
            "error_handling_section": "Error Handling" in content,
        }

        completeness_score = 85.0
        sections_found = sum(
            1 for condition in completeness_factors.values() if condition
        )
        total_sections = len(completeness_factors)

        if total_sections > 0:
            completeness_score = (sections_found / total_sections) * 100

        return completeness_score

    def _calculate_consistency(self, content: str) -> float:
        """Calculate content consistency"""

        consistency_score = 80.0

        # Check for consistency issues
        # Terminology consistency
        technical_terms = ["API", "endpoint", "authentication", "fraud", "detection"]
        term_usage = {}

        for term in technical_terms:
            pattern = r"\b" + re.escape(term) + r"\b"
            occurrences = len(re.findall(pattern, content, re.IGNORECASE))
            term_usage[term] = occurrences

        # Check for variation (should use consistent terminology)
        if len(term_usage) > 5:
            variation_penalty = min(
                10, abs(max(term_usage.values()) - min(term_usage.values())) * 2
            )
            consistency_score -= variation_penalty

        # Formatting consistency
        if "##" in content:
            header_count = len(re.findall(r"^##", content, re.MULTILINE))
            # Check header levels consistency
            header_levels = [
                len(h) for h in re.findall(r"^#+\s*(.+)$", content, re.MULTILINE)
            ]

            for level in header_levels:
                if abs(level - 2) > 1:  # Level skip
                    consistency_score -= 5

        return max(0, min(100, consistency_score))

    def _calculate_grammar(self, content: str) -> float:
        """Calculate grammar score"""

        # Simple heuristic checks
        grammar_score = 90.0

        # Common grammar issues
        grammar_issues = [
            (r"\s\s\s", 5),  # Multiple spaces
            (r"^\s|\s$", 3),  # Leading/trailing spaces
            (r"[A-Z][a-z]{2,}", 2, r"[a-z]{2,}"),  # Mixed case without word boundaries
            (r"[.!?]{2,}", 2),  # Repeated punctuation
            (
                r"\b(i|you|your|we|our|us)\b",
                3,
            ),  # First-person pronouns (context dependent)
        ]

        issues_found = 0
        for pattern, penalty in grammar_issues:
            issues_count = len(re.findall(pattern[0], content))
            if issues_count > 0:
                grammar_score -= penalty * issues_count
                issues_found += issues_count

        return max(0, min(100, grammar_score))

    def _calculate_structure(self, content: str) -> float:
        """Calculate structure score"""

        structure_score = 80.0

        # Header structure
        headers = re.findall(r"^#+\s*(.+)$", content, re.MULTILINE)
        if not headers:
            structure_score -= 20

        # Check header levels
        header_levels = [len(h) for h in headers]
        for level in header_levels:
            if level == 1:
                structure_score += 10  # Good use of H1
            elif level > 4:
                structure_score -= 10  # Too deep nesting

        # Table of contents
        if "Table of Contents" in content and not re.search(
            r"^#{1,4}\s*Table of Contents$", content
        ):
            structure_score -= 15

        # Code block formatting
        code_blocks = re.findall(r"```[\s\S]*?(\w+)?\n(?:.|\n)?", content)
        for block in code_blocks:
            if block and not block.strip().endswith("```"):
                structure_score -= 5

        return max(0, min(100, structure_score))

    def _calculate_accessibility(self, content: str) -> float:
        """Calculate accessibility score"""

        accessibility_score = 85.0

        # Check for headings
        headings = re.findall(r"^#+\s*(.+)$", content, re.MULTILINE)
        if headings and not any(h.strip() for h in headings if h.strip()):
            accessibility_score -= 10

        # Check for alt text on images/links
        alt_text_matches = re.findall(r"!\[[^\]]*\]\((.*?)\)", content)
        if not alt_text_matches:
            accessibility_score -= 15

        # Check for list formatting
        if re.search(r"^\s*[-*+]", content):
            list_count = len(re.findall(r"^\s*[-*+].+$", content, re.MULTILINE))
            if list_count > 0:
                accessibility_score -= min(10, list_count * 2)

        # Check for proper link text
        if re.search(r"\[.*\]\(\s*https?://\)", content):
            link_text_check = re.findall(
                r"\[.*\]\(\s*(https?://\w+\.\w+\.?\w+)\s*\)", content
            )
            for link_text in link_text_check:
                if link_text and "click here" not in link_text.lower():
                    accessibility_score -= 5

        return max(0, min(100, accessibility_score))

    def _adjust_content_score(
        self, content: str, base_metrics: QualityMetrics
    ) -> float:
        """Adjust content score based on length and quality factors"""

        length_factor = min(1.2, len(content) / 1000)  # Prefer comprehensive content
        quality_factor = 1.0 if base_metrics.overall_grade == "A" else 0.8

        return min(100, base_metrics.content_score * length_factor * quality_factor)

    def _calculate_overall_grade(self, metrics: QualityMetrics) -> str:
        """Calculate overall grade"""

        overall_score = (
            metrics.readability_score * 0.2
            + metrics.accuracy_score * 0.25
            + metrics.completeness_score * 0.2
            + metrics.consistency_score * 0.15
            + metrics.grammar_score * 0.1
            + metrics.accessibility_score * 0.1
        )

        if overall_score >= 90:
            return "A"
        elif overall_score >= 80:
            return "B"
        elif overall_score >= 70:
            return "C"
        elif overall_score >= 60:
            return "D"
        else:
            return "F"

    def _analyze_with_ai(self, content: str, filename: str) -> dict[str, Any]:
        """AI-powered content analysis"""

        insights = {"issues": [], "improvements": []}

        # Check for content clarity
        if len(content) < 200:
            insights["issues"].append(
                "Content too brief - minimum 200 characters recommended"
            )
            insights["improvements"].append(
                "Expand content with more detailed explanations"
            )

        # Check for technical accuracy
        if "API Reference" in filename and "http://" in content:
            if "127.0.0.1" in content or "localhost" in content:
                insights["issues"].append("Localhost found in API documentation")
                insights["improvements"].append("Use production URLs in examples")

        # Check for examples
        if "Example" in filename and "```" not in content:
            insights["issues"].append("Examples section found but no code blocks")
            insights["improvements"].append(
                "Add formatted code examples with syntax highlighting"
            )

        # Check for common issues
        common_issues = [
            ("TODO", "Marked as incomplete"),
            ("FIXME", "Needs fixing"),
            ("XXX", "Caution"),
            ("HACK", "Temporary workaround"),
        ]

        for issue in common_issues:
            if issue in content:
                insights["issues"].append(
                    f"Issue marker '{issue}' found - resolve before publishing"
                )

        return insights

    def generate_improvement_suggestions(
        self, metrics: QualityMetrics, file_path: Path
    ) -> list[str]:
        """Generate specific improvement suggestions"""

        suggestions = []

        if metrics.readability_score < 80:
            suggestions.append("Simplify complex sentences (average length > 25)")
            suggestions.append("Add more examples and visual aids")
            suggestions.append("Use consistent terminology throughout")

        if metrics.accuracy_score < 85:
            suggestions.append("Double-check API endpoints and examples")
            suggestions.append("Verify code examples work in current environment")
            suggestions.append("Add error handling examples for common scenarios")

        if metrics.completeness_score < 80:
            suggestions.append(
                "Add missing sections: Troubleshooting, Best Practices, Advanced Topics"
            )
            suggestions.append("Include more comprehensive examples and use cases")
            suggestions.append("Expand coverage to edge cases and unusual scenarios")

        if metrics.structure_score < 80:
            suggestions.append("Improve heading hierarchy and document structure")
            suggestions.append("Add table of contents for longer documents")
            suggestions.append("Consistently use heading levels (no skips)")

        if metrics.grammar_score < 85:
            suggestions.append("Run grammar and spell check on all documentation")
            suggestions.append("Use active voice and clear, concise language")
            suggestions.append("Consider professional editing for complex topics")

        if metrics.accessibility_score < 80:
            suggestions.append("Add alt text to all images and charts")
            suggestions.append("Ensure proper heading structure for screen readers")
            suggestions.append("Check color contrast and readability")
            suggestions.append("Make all interactive elements keyboard accessible")

        # Quality-specific suggestions
        if metrics.overall_grade in ["D", "F"]:
            suggestions.append("Comprehensive review and revision recommended")
            suggestions.append("Consider adding peer review process")
            suggestions.append("Focus on one quality area at a time")

        return suggestions

    def analyze_documentation_set(self, docs_dir: Path) -> dict[str, Any]:
        """Analyze entire documentation set"""

        print(f"Analyzing documentation in {docs_dir}...")

        all_metrics = []
        all_files = list(docs_dir.rglob("*.md"))

        for file_path in all_files:
            metrics = self.analyze_document_quality(file_path)
            all_metrics.append(metrics)

        # Calculate aggregate metrics
        total_score = sum(m.content_score for m in all_metrics)
        avg_score = total_score / len(all_metrics)

        aggregate_metrics = {
            "total_documents": len(all_files),
            "average_quality_score": avg_score,
            "grade_distribution": {
                grade: sum(1 for m in all_metrics if m.overall_grade == grade)
                for grade in ["A", "B", "C", "D", "F"]
            },
            "top_issues": [issue for m in all_metrics for issue in m.issues_found[:10]],
            "common_improvements": list(
                {imp for m in all_metrics for imp in m.improvements_suggested[:5]}
            ),
        }

        # Generate recommendations
        recommendations = self._generate_set_recommendations(aggregate_metrics)

        return {
            "file_metrics": all_metrics,
            "aggregate_metrics": aggregate_metrics,
            "recommendations": recommendations,
        }

    def _generate_set_recommendations(
        self, aggregate_metrics: dict[str, Any]
    ) -> list[str]:
        """Generate recommendations for documentation set"""

        recommendations = []
        avg_score = aggregate_metrics["average_quality_score"]

        if avg_score < 70:
            recommendations.append(
                "Comprehensive quality improvement needed - focus on accuracy and completeness"
            )
            recommendations.append("Establish documentation review process")
            recommendations.append(
                "Consider professional technical writing for complex topics"
            )

        if avg_score < 85:
            recommendations.append(
                "Enhance content with more examples and practical guidance"
            )
            recommendations.append("Improve consistency across all documentation")
            recommendations.append(
                "Add visual elements and diagrams for complex concepts"
            )

        if aggregate_metrics["grade_distribution"]["D"] > 0:
            recommendations.append(
                "Address failing grade documents first - quality is critical"
            )
            recommendations.append("Implement mandatory documentation standards")
            recommendations.append(
                "Focus on fundamental improvements before advanced features"
            )

        return recommendations

    def save_analysis_results(self, results: dict[str, Any], output_dir: Path) -> None:
        """Save analysis results"""

        output_dir.mkdir(parents=True, exist_ok=True)

        # Save detailed analysis
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        # Save JSON results
        results_file = output_dir / f"documentation_analysis_{timestamp}.json"
        with open(results_file, "w") as f:
            json.dump(results, f, indent=2)

        # Save summary report
        summary_file = output_dir / f"documentation_summary_{timestamp}.md"

        with open(summary_file, "w") as f:
            f.write("# Documentation Quality Analysis\n\n")
            f.write(f"**Generated**: {results['metadata']['generated_at']}\n\n")
            f.write("## Summary\n\n")
            f.write(
                f"- Total Documents: {results['aggregate_metrics']['total_documents']}\n"
            )
            f.write(
                f"- Average Quality Score: {results['aggregate_metrics']['average_quality_score']:.1f}\n"
            )
            f.write(
                f"- Grade Distribution: {results['aggregate_metrics']['grade_distribution']}\n\n"
            )
            f.write("## Top Issues\n\n")
            for i, issue in enumerate(results["aggregate_metrics"]["top_issues"], 1):
                f.write(f"{i + 1}. {issue}\n")
            f.write("\n")
            f.write("## Recommendations\n\n")
            for rec in results["recommendations"]:
                f.write(f"- {rec}\n")

        print(f"Analysis results saved to {output_dir}")
        print(f"Summary report saved to {summary_file}")


def main():
    """Main analysis function"""
    docs_dir = Path(__file__).parent.parent.parent / "docs"

    if not docs_dir.exists():
        print(f"Documentation directory not found: {docs_dir}")
        return

    analyzer = AIDocumentationAnalyzer()
    results = analyzer.analyze_documentation_set(docs_dir)
    analyzer.save_analysis_results(results, docs_dir / "quality_analysis")

    print("🤖 AI-Powered Documentation Analysis Complete!")


if __name__ == "__main__":
    main()
