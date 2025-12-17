
class MetadataCorrelationEngine:
    """
    Mock Metadata Correlation Service to allow backend startup.
    """
    def __init__(self, session):
        self.session = session

    def find_all_correlations(self, case_id: str):
        return []
