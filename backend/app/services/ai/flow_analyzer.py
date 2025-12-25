import ast
from typing import List, Dict, Any, Set

class SecurityFlowAnalyzer:
    """
    Analyzes code for security/data flow issues (Taint Tracking).
    """

    def __init__(self):
        self.sources = {"request", "args", "form", "json", "headers", "cookies"}
        self.sinks = {"eval", "exec", "subprocess", "os.system", "shutil"}

    def analyze(self, content: str) -> List[Dict[str, Any]]:
        findings = []
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return []

        # Taint tracking simulation
        # Map variables to their tainted sources
        self.tainted_vars: Set[str] = set()

        for node in ast.walk(tree):
            # Assignment from source
            if isinstance(node, ast.Assign):
                self._check_assignment(node)
                
            # Call to sink
            if isinstance(node, ast.Call):
                finding = self._check_sink_call(node)
                if finding:
                    findings.append(finding)

        return findings

    def _check_assignment(self, node: ast.Assign):
        """Check if assignment comes from a tainted source."""
        is_tainted = False
        
        # Check value being assigned
        if isinstance(node.value, ast.Call):
            if isinstance(node.value.func, ast.Name):
                if node.value.func.id in self.sources:
                    is_tainted = True
            elif isinstance(node.value.func, ast.Attribute):
                 if node.value.func.attr in self.sources:
                     is_tainted = True
        
        # If tainted, mark targets
        if is_tainted:
            for target in node.targets:
                if isinstance(target, ast.Name):
                    self.tainted_vars.add(target.id)

    def _check_sink_call(self, node: ast.Call) -> Dict[str, Any]:
        """Check if a tainted variable is passed to a sink."""
        sink_name = None
        if isinstance(node.func, ast.Name):
            sink_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            sink_name = node.func.attr

        if sink_name in self.sinks:
            for arg in node.args:
                if isinstance(arg, ast.Name) and arg.id in self.tainted_vars:
                    return {
                        "type": "taint_flow_detected",
                        "sink": sink_name,
                        "tainted_var": arg.id,
                        "severity": "CRITICAL",
                        "lineno": node.lineno
                    }
        return None
