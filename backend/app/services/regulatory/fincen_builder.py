import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, Any

class FinCENXMLBuilder:
    """
    Builder for generating FinCEN SAR (Suspicious Activity Report) compliant XML.
    Follows FinCEN XML Schema 2.0 specifications (simplified for this implementation).
    """

    def __init__(self):
        self.root = ET.Element("FATCA-OECD") # Using a generic root for illustration, specific FinCEN root usually varies
        self.root.set("version", "2.0")
        self.created_at = datetime.utcnow().isoformat()

    def build_header(self, submission_type: str = "SAR"):
        """Builds the report header."""
        header = ET.SubElement(self.root, "MessageHeader")
        ET.SubElement(header, "SendingCompanyID").text = "YOUR_ORG_ID" # Configurable
        ET.SubElement(header, "MessageRefId").text = f"MSG-{datetime.utcnow().timestamp()}"
        ET.SubElement(header, "MessageType").text = submission_type
        ET.SubElement(header, "Timestamp").text = self.created_at

    def add_activity(self, activity_data: Dict[str, Any]):
        """Adds a suspicious activity body."""
        body = ET.SubElement(self.root, "Activity")
        
        # Activity Info
        info = ET.SubElement(body, "ActivityInfo")
        ET.SubElement(info, "ActivityType").text = activity_data.get("type", "Suspicious")
        ET.SubElement(info, "Amount").text = str(activity_data.get("amount", 0.0))
        ET.SubElement(info, "Currency").text = activity_data.get("currency", "USD")

        # Subject Info
        if "subject" in activity_data:
            subject = ET.SubElement(body, "Subject")
            sub_data = activity_data["subject"]
            ET.SubElement(subject, "Name").text = sub_data.get("name", "Unknown")
            ET.SubElement(subject, "ID").text = sub_data.get("id", "Unknown")

        # Narrative
        narrative = ET.SubElement(body, "Narrative")
        narrative.text = activity_data.get("narrative", "")

    def to_xml_string(self) -> str:
        """Returns the XML string representation."""
        return ET.tostring(self.root, encoding="unicode", method="xml")
