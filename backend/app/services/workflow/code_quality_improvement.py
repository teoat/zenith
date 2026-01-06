#!/usr/bin/env python3
"""
Code Quality Improvement Service
Automated technical debt reduction and code smell remediation
"""

import ast
import logging
import os
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class CodeSmell(Enum):
    LONG_METHOD = "long_method"
    LARGE_CLASS = "large_class"
    DUPLICATE_CODE = "duplicate_code"
    COMPLEX_CONDITIONAL = "complex_conditional"
    LONG_PARAMETER_LIST = "long_parameter_list"
    DATA_CLASS = "data_class"
    FEATURE_ENVY = "feature_envy"
    MESSAGE_CHAIN = "message_chain"
    MIDDLE_MAN = "middle_man"
    INAPPROPRIATE_INTIMACY = "inappropriate_intimacy"


class DebtPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class CodeIssue:
    """Represents a code quality issue"""

    issue_id: str
    file_path: str
    line_number: int
    smell_type: CodeSmell
    severity: DebtPriority
    description: str
    code_snippet: str
    estimated_effort: str  # "quick_fix", "refactor", "major_rework"
    automated_fix_available: bool
    impact_score: float  # 0.0 to 1.0
    identified_at: datetime


@dataclass
class RefactoringTask:
    """Represents a refactoring task"""

    task_id: str
    issue_ids: list[str]
    title: str
    description: str
    priority: DebtPriority
    estimated_effort_days: float
    status: str  # "pending", "in_progress", "completed", "blocked"
    assigned_to: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: datetime | None = None
    automated: bool = False


@dataclass
class CodeQualityMetrics:
    """Code quality metrics"""

    total_lines: int
    cyclomatic_complexity_avg: float
    duplication_percentage: float
    test_coverage: float
    technical_debt_ratio: float
    maintainability_index: float
    issues_count: int
    issues_fixed: int


class CodeQualityImprovementService:
    """Automated code quality improvement and technical debt reduction"""

    def __init__(self):
        self.code_issues: dict[str, CodeIssue] = {}
        self.refactoring_tasks: dict[str, RefactoringTask] = {}
        self.code_metrics: dict[str, CodeQualityMetrics] = {}
        self.automated_fixes: dict[CodeSmell, Callable] = {}

        self._initialize_automated_fixes()
        self._setup_code_analysis()

    def _initialize_automated_fixes(self):
        """Initialize automated code fixes"""
        self.automated_fixes = {
            CodeSmell.LONG_METHOD: self._fix_long_method,
            CodeSmell.DUPLICATE_CODE: self._fix_duplicate_code,
            CodeSmell.LONG_PARAMETER_LIST: self._fix_long_parameter_list,
            CodeSmell.COMPLEX_CONDITIONAL: self._fix_complex_conditional,
        }

    def _setup_code_analysis(self):
        """Setup code analysis tools"""
        self.analysis_rules = {
            "max_method_length": 30,
            "max_class_length": 300,
            "max_parameters": 5,
            "max_complexity": 10,
            "duplicate_threshold": 0.8,  # 80% similarity
        }

    async def analyze_codebase(
        self, root_path: str = "/Users/Arief/Desktop/Zenith"
    ) -> dict[str, Any]:
        """Comprehensive codebase analysis"""
        logger.info(f"Starting codebase analysis for: {root_path}")

        analysis_results = {
            "files_analyzed": 0,
            "issues_found": 0,
            "automated_fixes_available": 0,
            "technical_debt_estimate": 0,
            "issues_by_type": {},
            "issues_by_severity": {},
        }

        # Find Python files
        python_files = []
        for root, dirs, files in os.walk(root_path):
            # Skip certain directories
            dirs[:] = [
                d
                for d in dirs
                if not d.startswith(".")
                and d not in ["node_modules", "__pycache__", ".git"]
            ]

            for file in files:
                if file.endswith(".py"):
                    python_files.append(os.path.join(root, file))

        logger.info(f"Found {len(python_files)} Python files to analyze")

        for file_path in python_files[:50]:  # Limit for performance
            try:
                issues = await self._analyze_file(file_path)
                analysis_results["files_analyzed"] += 1

                for issue in issues:
                    self.code_issues[issue.issue_id] = issue
                    analysis_results["issues_found"] += 1

                    if issue.automated_fix_available:
                        analysis_results["automated_fixes_available"] += 1

                    # Categorize issues
                    issue_type = issue.smell_type.value
                    severity = issue.severity.value

                    analysis_results["issues_by_type"][issue_type] = (
                        analysis_results["issues_by_type"].get(issue_type, 0) + 1
                    )
                    analysis_results["issues_by_severity"][severity] = (
                        analysis_results["issues_by_severity"].get(severity, 0) + 1
                    )

                    # Estimate technical debt
                    effort_multiplier = {
                        "quick_fix": 0.5,
                        "refactor": 2,
                        "major_rework": 5,
                    }
                    analysis_results["technical_debt_estimate"] += (
                        issue.impact_score
                        * effort_multiplier.get(issue.estimated_effort, 1)
                    )

            except Exception as e:
                logger.error(f"Failed to analyze {file_path}: {e}")

        # Calculate overall metrics
        analysis_results["technical_debt_hours"] = analysis_results[
            "technical_debt_estimate"
        ]
        analysis_results["code_quality_score"] = max(
            0, 100 - (analysis_results["issues_found"] * 2)
        )

        logger.info(
            f"Analysis complete: {analysis_results['issues_found']} issues found in {analysis_results['files_analyzed']} files"
        )

        return analysis_results

    async def _analyze_file(self, file_path: str) -> list[CodeIssue]:
        """Analyze a single Python file for code smells"""
        issues = []

        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()

            lines = content.split("\n")
            tree = ast.parse(content, file_path)

            # Analyze AST for various smells
            issues.extend(self._detect_long_methods(tree, file_path, lines))
            issues.extend(self._detect_large_classes(tree, file_path, lines))
            issues.extend(self._detect_long_parameter_lists(tree, file_path, lines))
            issues.extend(self._detect_complex_conditionals(tree, file_path, lines))

            # Text-based analysis
            issues.extend(self._detect_duplicate_code(content, file_path, lines))

        except SyntaxError:
            logger.warning(f"Syntax error in {file_path}, skipping AST analysis")
        except Exception as e:
            logger.error(f"Error analyzing {file_path}: {e}")

        return issues

    def _detect_long_methods(
        self, tree: ast.AST, file_path: str, lines: list[str]
    ) -> list[CodeIssue]:
        """Detect methods that are too long"""
        issues = []

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                method_length = node.end_lineno - node.lineno

                if method_length > self.analysis_rules["max_method_length"]:
                    severity = (
                        DebtPriority.HIGH if method_length > 50 else DebtPriority.MEDIUM
                    )

                    issue = CodeIssue(
                        issue_id=f"long_method_{file_path}_{node.lineno}",
                        file_path=file_path,
                        line_number=node.lineno,
                        smell_type=CodeSmell.LONG_METHOD,
                        severity=severity,
                        description=f"Method '{node.name}' is {method_length} lines long (max recommended: {self.analysis_rules['max_method_length']})",
                        code_snippet="\n".join(
                            lines[node.lineno - 1 : node.lineno + 5]
                        ),
                        estimated_effort="refactor",
                        automated_fix_available=True,
                        impact_score=min(1.0, method_length / 100),
                        identified_at=datetime.now(),
                    )
                    issues.append(issue)

        return issues

    def _detect_large_classes(
        self, tree: ast.AST, file_path: str, lines: list[str]
    ) -> list[CodeIssue]:
        """Detect classes that are too large"""
        issues = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                class_length = node.end_lineno - node.lineno

                if class_length > self.analysis_rules["max_class_length"]:
                    issue = CodeIssue(
                        issue_id=f"large_class_{file_path}_{node.lineno}",
                        file_path=file_path,
                        line_number=node.lineno,
                        smell_type=CodeSmell.LARGE_CLASS,
                        severity=DebtPriority.HIGH,
                        description=f"Class '{node.name}' is {class_length} lines long (max recommended: {self.analysis_rules['max_class_length']})",
                        code_snippet="\n".join(
                            lines[node.lineno - 1 : node.lineno + 3]
                        ),
                        estimated_effort="major_rework",
                        automated_fix_available=False,
                        impact_score=min(1.0, class_length / 500),
                        identified_at=datetime.now(),
                    )
                    issues.append(issue)

        return issues

    def _detect_long_parameter_lists(
        self, tree: ast.AST, file_path: str, lines: list[str]
    ) -> list[CodeIssue]:
        """Detect functions with too many parameters"""
        issues = []

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                param_count = len(node.args.args)

                if param_count > self.analysis_rules["max_parameters"]:
                    issue = CodeIssue(
                        issue_id=f"long_params_{file_path}_{node.lineno}",
                        file_path=file_path,
                        line_number=node.lineno,
                        smell_type=CodeSmell.LONG_PARAMETER_LIST,
                        severity=DebtPriority.MEDIUM,
                        description=f"Function '{node.name}' has {param_count} parameters (max recommended: {self.analysis_rules['max_parameters']})",
                        code_snippet="\n".join(
                            lines[node.lineno - 1 : node.lineno + 2]
                        ),
                        estimated_effort="refactor",
                        automated_fix_available=True,
                        impact_score=min(1.0, param_count / 10),
                        identified_at=datetime.now(),
                    )
                    issues.append(issue)

        return issues

    def _detect_complex_conditionals(
        self, tree: ast.AST, file_path: str, lines: list[str]
    ) -> list[CodeIssue]:
        """Detect complex conditional statements"""
        issues = []

        for node in ast.walk(tree):
            if isinstance(node, ast.If):
                # Calculate complexity based on nested conditions
                complexity = self._calculate_conditional_complexity(node)

                if complexity > self.analysis_rules["max_complexity"]:
                    issue = CodeIssue(
                        issue_id=f"complex_conditional_{file_path}_{node.lineno}",
                        file_path=file_path,
                        line_number=node.lineno,
                        smell_type=CodeSmell.COMPLEX_CONDITIONAL,
                        severity=DebtPriority.MEDIUM,
                        description=f"Complex conditional with complexity score {complexity} (max recommended: {self.analysis_rules['max_complexity']})",
                        code_snippet="\n".join(
                            lines[node.lineno - 1 : node.lineno + 3]
                        ),
                        estimated_effort="refactor",
                        automated_fix_available=True,
                        impact_score=min(1.0, complexity / 20),
                        identified_at=datetime.now(),
                    )
                    issues.append(issue)

        return issues

    def _calculate_conditional_complexity(self, node: ast.If, depth: int = 1) -> int:
        """Calculate complexity of conditional statement"""
        complexity = depth

        # Check for and/or operators
        if hasattr(node.test, "left"):
            complexity += 1

        # Check nested if statements
        if node.orelse:
            for child in node.orelse:
                if isinstance(child, ast.If):
                    complexity += self._calculate_conditional_complexity(
                        child, depth + 1
                    )

        return complexity

    def _detect_duplicate_code(
        self, content: str, file_path: str, lines: list[str]
    ) -> list[CodeIssue]:
        """Detect duplicate code blocks"""
        issues = []

        # Simple duplicate detection - check for repeated code blocks
        code_blocks = []
        for i, line in enumerate(lines):
            if line.strip() and not line.strip().startswith("#"):
                # Extract code blocks of 3-5 lines
                if i + 2 < len(lines):
                    block = "\n".join(lines[i : i + 3]).strip()
                    if len(block) > 20:  # Minimum block size
                        code_blocks.append((i + 1, block))

        # Find duplicates
        seen_blocks = {}
        for line_num, block in code_blocks:
            if block in seen_blocks:
                # Found duplicate
                original_line = seen_blocks[block]

                issue = CodeIssue(
                    issue_id=f"duplicate_code_{file_path}_{line_num}",
                    file_path=file_path,
                    line_number=line_num,
                    smell_type=CodeSmell.DUPLICATE_CODE,
                    severity=DebtPriority.MEDIUM,
                    description=f"Duplicate code block found (original at line {original_line})",
                    code_snippet=block[:100] + "..." if len(block) > 100 else block,
                    estimated_effort="refactor",
                    automated_fix_available=True,
                    impact_score=0.6,
                    identified_at=datetime.now(),
                )
                issues.append(issue)
            else:
                seen_blocks[block] = line_num

        return issues

    async def apply_automated_fixes(self) -> dict[str, Any]:
        """Apply all available automated fixes"""
        results = {
            "fixes_attempted": 0,
            "fixes_successful": 0,
            "fixes_failed": 0,
            "issues_resolved": [],
        }

        for issue in self.code_issues.values():
            if issue.automated_fix_available and not self._is_issue_resolved(issue):
                results["fixes_attempted"] += 1

                try:
                    success = await self._apply_fix(issue)
                    if success:
                        results["fixes_successful"] += 1
                        results["issues_resolved"].append(issue.issue_id)
                        logger.info(f"Successfully fixed issue: {issue.issue_id}")
                    else:
                        results["fixes_failed"] += 1
                        logger.warning(f"Failed to fix issue: {issue.issue_id}")

                except Exception as e:
                    results["fixes_failed"] += 1
                    logger.error(f"Error fixing issue {issue.issue_id}: {e}")

        return results

    async def _apply_fix(self, issue: CodeIssue) -> bool:
        """Apply automated fix for a specific issue"""
        if issue.smell_type in self.automated_fixes:
            return await self.automated_fixes[issue.smell_type](issue)
        return False

    async def _fix_long_method(self, issue: CodeIssue) -> bool:
        """Apply automated fix for long method"""
        # This would require more sophisticated code analysis and transformation
        # For now, we'll create a refactoring task
        task = RefactoringTask(
            task_id=f"refactor_{issue.issue_id}",
            issue_ids=[issue.issue_id],
            title=f"Refactor long method: {issue.description}",
            description="Break down long method into smaller, focused functions",
            priority=issue.severity,
            estimated_effort_days=2.0,
            status="pending",
            automated=False,
        )

        self.refactoring_tasks[task.task_id] = task
        return True

    async def _fix_duplicate_code(self, issue: CodeIssue) -> bool:
        """Apply automated fix for duplicate code"""
        # Extract common functionality to a utility function
        task = RefactoringTask(
            task_id=f"refactor_{issue.issue_id}",
            issue_ids=[issue.issue_id],
            title=f"Extract duplicate code: {issue.description}",
            description="Create utility function for duplicated code block",
            priority=issue.severity,
            estimated_effort_days=1.0,
            status="pending",
            automated=False,
        )

        self.refactoring_tasks[task.task_id] = task
        return True

    async def _fix_long_parameter_list(self, issue: CodeIssue) -> bool:
        """Apply automated fix for long parameter list"""
        # Introduce parameter object pattern
        task = RefactoringTask(
            task_id=f"refactor_{issue.issue_id}",
            issue_ids=[issue.issue_id],
            title=f"Refactor parameter list: {issue.description}",
            description="Introduce parameter object to reduce parameter count",
            priority=issue.severity,
            estimated_effort_days=1.5,
            status="pending",
            automated=False,
        )

        self.refactoring_tasks[task.task_id] = task
        return True

    async def _fix_complex_conditional(self, issue: CodeIssue) -> bool:
        """Apply automated fix for complex conditional"""
        # Extract method or use strategy pattern
        task = RefactoringTask(
            task_id=f"refactor_{issue.issue_id}",
            issue_ids=[issue.issue_id],
            title=f"Simplify complex conditional: {issue.description}",
            description="Extract conditional logic into separate method or use strategy pattern",
            priority=issue.severity,
            estimated_effort_days=1.5,
            status="pending",
            automated=False,
        )

        self.refactoring_tasks[task.task_id] = task
        return True

    def _is_issue_resolved(self, issue: CodeIssue) -> bool:
        """Check if an issue has been resolved"""
        # In production, this would check if the issue still exists in the code
        # For now, assume issues are not resolved
        return False

    async def generate_refactoring_plan(self) -> dict[str, Any]:
        """Generate comprehensive refactoring plan"""
        plan = {
            "total_issues": len(self.code_issues),
            "automated_fixes": len(
                [i for i in self.code_issues.values() if i.automated_fix_available]
            ),
            "refactoring_tasks": len(self.refactoring_tasks),
            "estimated_effort_days": sum(
                t.estimated_effort_days for t in self.refactoring_tasks.values()
            ),
            "tasks_by_priority": {},
            "tasks_by_type": {},
        }

        # Group tasks by priority and type
        for task in self.refactoring_tasks.values():
            priority = task.priority.value
            plan["tasks_by_priority"][priority] = (
                plan["tasks_by_priority"].get(priority, 0) + 1
            )

            # Determine task type from title
            if "duplicate" in task.title.lower():
                task_type = "duplicate_code"
            elif "parameter" in task.title.lower():
                task_type = "parameter_refactor"
            elif "conditional" in task.title.lower():
                task_type = "conditional_simplify"
            elif "method" in task.title.lower():
                task_type = "method_refactor"
            else:
                task_type = "general_refactor"

            plan["tasks_by_type"][task_type] = (
                plan["tasks_by_type"].get(task_type, 0) + 1
            )

        return plan

    def get_quality_dashboard(self) -> dict[str, Any]:
        """Get code quality dashboard"""
        total_issues = len(self.code_issues)
        resolved_issues = len(
            [i for i in self.code_issues.values() if self._is_issue_resolved(i)]
        )

        return {
            "total_issues": total_issues,
            "resolved_issues": resolved_issues,
            "resolution_rate": (
                resolved_issues / total_issues if total_issues > 0 else 0
            ),
            "refactoring_tasks": len(self.refactoring_tasks),
            "issues_by_severity": self._get_issues_by_severity(),
            "issues_by_type": self._get_issues_by_type(),
            "estimated_debt_hours": sum(
                i.impact_score * 8 for i in self.code_issues.values()
            ),  # Rough estimate
        }

    def _get_issues_by_severity(self) -> dict[str, int]:
        """Get issues count by severity"""
        severities = {}
        for issue in self.code_issues.values():
            severity = issue.severity.value
            severities[severity] = severities.get(severity, 0) + 1
        return severities

    def _get_issues_by_type(self) -> dict[str, int]:
        """Get issues count by type"""
        types = {}
        for issue in self.code_issues.values():
            smell_type = issue.smell_type.value
            types[smell_type] = types.get(smell_type, 0) + 1
        return types


# Global instance
code_quality_improvement = CodeQualityImprovementService()
