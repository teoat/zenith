import ast
import math
from typing import Any


class ASTComplexityAnalyzer:
    """
    Analyzes Python code AST for complexity metrics (Cyclomatic, Halstead).
    """

    def analyze(self, content: str) -> dict[str, Any]:
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return {"error": "SyntaxError"}

        cyclomatic = self._calculate_cyclomatic(tree)
        halstead = self._calculate_halstead(tree)

        return {
            "cyclomatic_complexity": cyclomatic,
            "halstead_metrics": halstead,
            "maintainability_index": self._calculate_maintainability_index(
                halstead, cyclomatic, len(content.splitlines())
            ),
        }

    def _calculate_cyclomatic(self, node: ast.AST) -> int:
        complexity = 1
        for child in ast.walk(node):
            if isinstance(
                child, (ast.If, ast.While, ast.For, ast.With, ast.ExceptHandler)
            ):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        return complexity

    def _calculate_halstead(self, node: ast.AST) -> dict[str, float]:
        operators = set()
        operands = set()
        operator_count = 0
        operand_count = 0

        for child in ast.walk(node):
            if isinstance(
                child,
                (
                    ast.Add,
                    ast.Sub,
                    ast.Mult,
                    ast.Div,
                    ast.Mod,
                    ast.Pow,
                    ast.LShift,
                    ast.RShift,
                    ast.BitOr,
                    ast.BitXor,
                    ast.BitAnd,
                    ast.FloorDiv,
                    ast.Eq,
                    ast.NotEq,
                    ast.Lt,
                    ast.LtE,
                    ast.Gt,
                    ast.GtE,
                    ast.Is,
                    ast.IsNot,
                    ast.In,
                    ast.NotIn,
                    ast.And,
                    ast.Or,
                    ast.Not,
                ),
            ):
                operators.add(type(child).__name__)
                operator_count += 1
            elif isinstance(child, (ast.Name, ast.Constant, ast.Str, ast.Num)):
                if isinstance(child, ast.Name):
                    operands.add(child.id)
                elif isinstance(child, ast.Constant):
                    operands.add(str(child.value))
                operand_count += 1

        n1 = len(operators)
        n2 = len(operands)
        N1 = operator_count
        N2 = operand_count

        if n1 == 0 or n2 == 0:
            return {"volume": 0, "difficulty": 0, "effort": 0}

        vocabulary = n1 + n2
        length = N1 + N2
        volume = length * math.log2(vocabulary) if vocabulary > 0 else 0
        difficulty = (n1 / 2) * (N2 / n2)
        effort = difficulty * volume

        return {"volume": volume, "difficulty": difficulty, "effort": effort}

    def _calculate_maintainability_index(self, halstead, cyclomatic, loc) -> float:
        if loc == 0:
            return 100.0
        volume = halstead.get("volume", 0)
        # MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC)
        # Using simplified formula often used
        try:
            mi = (
                171
                - 5.2 * math.log(max(1, volume))
                - 0.23 * cyclomatic
                - 16.2 * math.log(max(1, loc))
            )
            return max(0, min(100, mi))
        except:
            return 0.0
