import os
import traceback
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.elements import WKTElement

from config import settings
from models import Amenity
from schemas import SUPPORTED_CATEGORIES
from deduplicator import find_duplicate, calculate_haversine_distance
from observability import amenity_ingestion_failures_total, amenity_duplicates_detected_total
import structlog

logger = structlog.get_logger("amenity.ingestion")


class IngestionPipeline:
    """
    Orchestrates the ingestion lifecycle of an amenity payload:
    Raw Source -> Normalizer -> Validator -> Deduplicator -> Storage
    Logs validation and processing failures to /docs/production_incidents.md.
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def ingest(self, raw_payload: Dict[str, Any]) -> Optional[Amenity]:
        source = raw_payload.get("source", "unknown")
        stage = "raw_source"
        try:
            # 1. Normalization Stage
            stage = "normalizer"
            normalized = self.normalize(raw_payload)

            # 2. Validation Stage
            stage = "validator"
            self.validate(normalized)

            # 3. Deduplication Stage
            stage = "deduplicator"
            duplicate_record = await self.deduplicate(normalized)

            # 4. Storage Stage
            stage = "storage"
            stored_amenity = await self.persist(normalized, duplicate_record)
            return stored_amenity

        except Exception as e:
            error_msg = str(e)
            tb_str = traceback.format_exc()
            logger.error("Ingestion pipeline failed", stage=stage, error=error_msg)
            
            # Increment Prometheus counter
            amenity_ingestion_failures_total.labels(stage=stage, reason=error_msg.split(":")[0]).inc()

            # Record incident in production_incidents.md
            self.log_incident_to_file(source, stage, raw_payload, error_msg, tb_str)
            raise e

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cleans and normalizes fields to standard formats.
        """
        normalized = raw.copy()
        
        # Strip name whitespace
        if "name" in normalized and normalized["name"]:
            normalized["name"] = str(normalized["name"]).strip()

        # Lowercase and clean category
        if "category" in normalized and normalized["category"]:
            cat = str(normalized["category"]).strip().lower()
            # Basic variations handling
            if cat in ["schools", "schooling"]:
                cat = "school"
            elif cat in ["colleges", "university"]:
                cat = "college"
            elif cat in ["hospitals", "medical center"]:
                cat = "hospital"
            elif cat in ["clinics"]:
                cat = "clinic"
            elif cat in ["pharmacies", "drugstore"]:
                cat = "pharmacy"
            elif cat in ["restaurants", "diner"]:
                cat = "restaurant"
            elif cat in ["cafes", "coffee shop"]:
                cat = "cafe"
            elif cat in ["grocery", "groceries"]:
                cat = "grocery_store"
            elif cat in ["supermarkets"]:
                cat = "supermarket"
            elif cat in ["gyms", "fitness center"]:
                cat = "gym"
            elif cat in ["parks", "playground"]:
                cat = "park"
            elif cat in ["banks", "atm"]:
                cat = "bank"
            elif cat in ["petrol stations", "gas station"]:
                cat = "petrol_station"
            elif cat in ["bus terminal", "bus stops"]:
                cat = "bus_stop"
            elif cat in ["railway station"]:
                cat = "railway_station"
            elif cat in ["airports"]:
                cat = "airport"
            normalized["category"] = cat

        if "address" in normalized and normalized["address"]:
            normalized["address"] = str(normalized["address"]).strip()
        
        # Source default
        normalized["source"] = str(normalized.get("source", "unknown")).strip()

        # Parse coordinates to floats
        try:
            normalized["latitude"] = float(normalized["latitude"])
            normalized["longitude"] = float(normalized["longitude"])
        except (ValueError, TypeError, KeyError):
            pass  # Let validator raise the schema error

        # Parse confidence score
        try:
            normalized["confidence_score"] = float(normalized.get("confidence_score", 1.0))
        except (ValueError, TypeError):
            normalized["confidence_score"] = 1.0

        return normalized

    def validate(self, normalized: Dict[str, Any]) -> None:
        """
        Enforces schema validations and geographical range restrictions.
        """
        # Name validation
        name = normalized.get("name")
        if not name or not name.strip():
            raise ValueError("Validation failed: Name cannot be empty.")

        # Category validation
        category = normalized.get("category")
        if category not in SUPPORTED_CATEGORIES:
            raise ValueError(f"Validation failed: Unsupported category '{category}'.")

        # Coordinates range check
        lat = normalized.get("latitude")
        lon = normalized.get("longitude")
        if lat is None or lon is None:
            raise ValueError("Validation failed: Coordinates must contain both latitude and longitude.")

        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            raise ValueError(f"Validation failed: Coordinates out of range (lat: {lat}, lon: {lon}).")

        # Optional Coimbatore bounding box validation
        # Only log warning or raise error if required. Let's enforce it to be in or near Coimbatore limits (100km buffer)
        # to prevent bad garbage inputs
        dist_to_coimbatore = calculate_haversine_distance(lat, lon, 11.0168, 76.9558)
        if dist_to_coimbatore > 100000.0:  # 100km radius threshold from Coimbatore city center
            raise ValueError(f"Validation failed: Coordinate ({lat}, {lon}) is too far from Coimbatore (> 100km).")

    async def deduplicate(self, normalized: Dict[str, Any]) -> Optional[Amenity]:
        """
        Queries DB for candidates within 100 meters and checks Jaro-Winkler thresholds.
        """
        lat = normalized["latitude"]
        lon = normalized["longitude"]
        category = normalized["category"]

        # PostGIS query checking ST_DWithin from input coordinate (limit to 100 meters)
        # using async session
        point_geom = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
        query = select(Amenity).where(
            Amenity.category == category,
            func.ST_DWithin(Amenity.location, point_geom, 100.0)
        )
        
        res = await self.session.execute(query)
        candidates = res.scalars().all()

        # Convert candidates to dict format for deduplicator helper
        candidate_dicts = []
        for cand in candidates:
            candidate_dicts.append({
                "id": cand.id,
                "name": cand.name,
                "category": cand.category,
                "latitude": cand.latitude,
                "longitude": cand.longitude,
                "address": cand.address,
                "confidence_score": cand.confidence_score
            })

        duplicate_dict = find_duplicate(
            incoming_name=normalized["name"],
            incoming_category=category,
            incoming_lat=lat,
            incoming_lon=lon,
            candidates=candidate_dicts,
            distance_threshold_meters=15.0,
            name_similarity_threshold=0.82
        )

        if duplicate_dict:
            # Match found, return the ORM object
            for cand in candidates:
                if cand.id == duplicate_dict["id"]:
                    return cand

        return None

    async def persist(self, normalized: Dict[str, Any], duplicate: Optional[Amenity]) -> Amenity:
        """
        Saves new amenity or merges fields with an existing duplicate.
        """
        now = datetime.now(timezone.utc)
        if duplicate:
            logger.info("Merging payload with existing duplicate record", duplicate_id=duplicate.id)
            # Update verification time
            duplicate.last_verified_at = now
            
            # Merge address if current record is empty or if incoming address is longer
            if normalized.get("address"):
                if not duplicate.address or len(normalized["address"]) > len(duplicate.address):
                    duplicate.address = normalized["address"]

            # Merge confidence: keep the higher rating
            incoming_conf = normalized.get("confidence_score", 1.0)
            if duplicate.confidence_score is None or incoming_conf > duplicate.confidence_score:
                duplicate.confidence_score = incoming_conf

            # Merge source tracks if multiple sources
            if normalized.get("source") and normalized["source"] not in (duplicate.source or ""):
                duplicate.source = f"{duplicate.source},{normalized['source']}"[:100]

            self.session.add(duplicate)
            await self.session.commit()
            
            # Increment Prometheus Counter
            amenity_duplicates_detected_total.inc()
            return duplicate
        else:
            logger.info("Creating new amenity record", name=normalized["name"])
            # Create WKT POINT geometry
            wkt = f"POINT({normalized['longitude']} {normalized['latitude']})"
            geom = WKTElement(wkt, srid=4326)

            new_amenity = Amenity(
                id=uuid.uuid4(),
                name=normalized["name"],
                category=normalized["category"],
                latitude=normalized["latitude"],
                longitude=normalized["longitude"],
                location=geom,
                address=normalized.get("address"),
                source=normalized.get("source"),
                confidence_score=normalized.get("confidence_score", 1.0),
                last_verified_at=now
            )
            self.session.add(new_amenity)
            await self.session.commit()
            return new_amenity

    def log_incident_to_file(
        self,
        source: str,
        stage: str,
        payload: Dict[str, Any],
        error_msg: str,
        traceback_str: str
    ) -> None:
        """
        Appends ingestion failures directly to docs/production_incidents.md.
        """
        incident_path = "/Users/trishajanath/realState/docs/production_incidents.md"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_entry = f"\n---\n\n## Ingestion Failure - Amenity Intelligence Service ({timestamp})\n"
        log_entry += f"* **Source**: `{source}`\n"
        log_entry += f"* **Failure Stage**: `{stage}`\n"
        log_entry += f"* **Error Message**: `{error_msg}`\n"
        log_entry += f"* **Raw Payload**:\n```json\n{payload}\n```\n"
        log_entry += f"* **Stack Trace**:\n```python\n{traceback_str}```\n"

        try:
            if os.path.exists(incident_path):
                with open(incident_path, "a") as f:
                    f.write(log_entry)
                logger.info("Ingestion failure logged to production_incidents.md successfully.")
            else:
                logger.warning("production_incidents.md path does not exist. Skipping file write.", path=incident_path)
        except Exception as file_err:
            logger.error("Failed to write incident log to file", error=str(file_err))
