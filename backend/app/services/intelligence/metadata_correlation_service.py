# backend/services/metadata_correlation.py
import logging
from collections import defaultdict

from sqlalchemy.orm import Session

from core.database import Entity

logger = logging.getLogger(__name__)


class MetadataCorrelationEngine:
    """
    Detects relationships between entities via shared metadata.

    Examples:
    - Same phone number: Person A and Person B share +1-555-0123
    - Same email: Person C and Company D both registered to john@example.com
    - Same IP: User E and Merchant F both accessed from 192.168.1.100
    - Same address: Individual G and Shell Corp H both at 123 Main St
    """

    def __init__(self, session: Session):
        self.session = session
        self.correlation_strength_weights = {
            "phone": 0.8,  # High weight - phone is unique
            "email": 0.85,  # Very high weight
            "address": 0.7,  # Medium weight - shared addresses are common
            "ip_address": 0.6,  # Lower weight - IP can be shared
            "name_similarity": 0.5,  # Fuzzy match on names
        }

    def find_all_correlations(self, case_id: str) -> list[dict]:
        """Find all metadata correlations within a case"""
        entities = self.session.query(Entity).filter(Entity.case_id == case_id).all()

        correlations = []

        # Check each metadata type
        correlations.extend(self._find_phone_correlations(entities))
        correlations.extend(self._find_email_correlations(entities))
        correlations.extend(self._find_address_correlations(entities))
        correlations.extend(self._find_ip_correlations(entities))

        # Deduplicate (avoid reporting same pair twice)
        unique_correlations = []
        seen = set()
        for corr in correlations:
            pair_key = tuple(sorted([corr["entity_a"], corr["entity_b"]]))
            if pair_key not in seen:
                unique_correlations.append(corr)
                seen.add(pair_key)

        return unique_correlations

    def _find_phone_correlations(self, entities: list[Entity]) -> list[dict]:
        """Find entities sharing phone numbers"""
        phone_map = defaultdict(list)

        for entity in entities:
            # Extract phone from metadata
            phones = self._extract_phones(entity)
            for phone in phones:
                phone_map[phone].append(entity)

        correlations = []
        for phone, entity_list in phone_map.items():
            if len(entity_list) > 1:
                for i in range(len(entity_list)):
                    for j in range(i + 1, len(entity_list)):
                        correlations.append(
                            {
                                "entity_a": entity_list[i].id,
                                "entity_b": entity_list[j].id,
                                "metadata_type": "phone",
                                "metadata_value": phone,
                                "confidence": self.correlation_strength_weights[
                                    "phone"
                                ],
                                "reasoning": f"Both entities share phone {phone}",
                            }
                        )

        return correlations

    def _find_email_correlations(self, entities: list[Entity]) -> list[dict]:
        """Find entities sharing email addresses"""
        email_map = defaultdict(list)

        for entity in entities:
            emails = self._extract_emails(entity)
            for email in emails:
                email_map[email.lower()].append(entity)

        correlations = []
        for email, entity_list in email_map.items():
            if len(entity_list) > 1:
                for i in range(len(entity_list)):
                    for j in range(i + 1, len(entity_list)):
                        correlations.append(
                            {
                                "entity_a": entity_list[i].id,
                                "entity_b": entity_list[j].id,
                                "metadata_type": "email",
                                "metadata_value": email,
                                "confidence": self.correlation_strength_weights[
                                    "email"
                                ],
                                "reasoning": f"Both entities share email {email}",
                            }
                        )

        return correlations

    def _find_address_correlations(self, entities: list[Entity]) -> list[dict]:
        """Find entities sharing physical addresses"""
        address_map = defaultdict(list)

        for entity in entities:
            addresses = self._extract_addresses(entity)
            for address in addresses:
                address_key = self._normalize_address(address)
                address_map[address_key].append(entity)

        correlations = []
        for address, entity_list in address_map.items():
            if len(entity_list) > 1:
                for i in range(len(entity_list)):
                    for j in range(i + 1, len(entity_list)):
                        correlations.append(
                            {
                                "entity_a": entity_list[i].id,
                                "entity_b": entity_list[j].id,
                                "metadata_type": "address",
                                "metadata_value": address,
                                "confidence": self.correlation_strength_weights[
                                    "address"
                                ],
                                "reasoning": f"Both entities share address {address}",
                            }
                        )

        return correlations

    def _find_ip_correlations(self, entities: list[Entity]) -> list[dict]:
        """Find entities sharing IP addresses"""
        ip_map = defaultdict(list)

        for entity in entities:
            ips = self._extract_ips(entity)
            for ip in ips:
                ip_map[ip].append(entity)

        correlations = []
        for ip, entity_list in ip_map.items():
            if len(entity_list) > 1:
                for i in range(len(entity_list)):
                    for j in range(i + 1, len(entity_list)):
                        correlations.append(
                            {
                                "entity_a": entity_list[i].id,
                                "entity_b": entity_list[j].id,
                                "metadata_type": "ip_address",
                                "metadata_value": ip,
                                "confidence": self.correlation_strength_weights[
                                    "ip_address"
                                ],
                                "reasoning": f"Both entities accessed from IP {ip}",
                            }
                        )

        return correlations

    def _extract_phones(self, entity: Entity) -> set[str]:
        """Extract phone numbers from entity metadata"""
        phones = set()
        if entity.entity_metadata and "phone" in entity.entity_metadata:
            phones.add(entity.entity_metadata["phone"])
        if entity.entity_metadata and "phones" in entity.entity_metadata:
            phones.update(entity.entity_metadata["phones"])
        return phones

    def _extract_emails(self, entity: Entity) -> set[str]:
        """Extract emails from entity metadata"""
        emails = set()
        if entity.entity_metadata and "email" in entity.entity_metadata:
            emails.add(entity.entity_metadata["email"])
        if entity.entity_metadata and "emails" in entity.entity_metadata:
            emails.update(entity.entity_metadata["emails"])
        return emails

    def _extract_addresses(self, entity: Entity) -> set[str]:
        """Extract addresses from entity metadata"""
        addresses = set()
        if entity.entity_metadata and "address" in entity.entity_metadata:
            addresses.add(entity.entity_metadata["address"])
        if entity.entity_metadata and "addresses" in entity.entity_metadata:
            addresses.update(entity.entity_metadata["addresses"])
        return addresses

    def _extract_ips(self, entity: Entity) -> set[str]:
        """Extract IP addresses from entity metadata"""
        ips = set()
        if entity.entity_metadata and "ip_address" in entity.entity_metadata:
            ips.add(entity.entity_metadata["ip_address"])
        if entity.entity_metadata and "ip_addresses" in entity.entity_metadata:
            ips.update(entity.entity_metadata["ip_addresses"])
        return ips

    def _normalize_address(self, address: str) -> str:
        """Normalize address for comparison (lowercase, strip whitespace)"""
        return address.lower().strip()
