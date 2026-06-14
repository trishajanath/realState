"""
Shared normalizer utilities for all scraper providers.
Centralises price parsing, area parsing, type detection, and locality matching
so individual provider normalizers stay thin and consistent.
"""
import re
from typing import Any, Optional

# Known Coimbatore localities ordered longest-first to avoid partial matches
COIMBATORE_LOCALITIES = [
    "Saravanampatti", "Saibaba Colony", "RS Puram", "Peelamedu",
    "Singanallur", "Kalapatti", "Gandhipuram", "Tidel Park",
    "Avinashi Road", "Sathy Road", "Race Course", "Vadavalli",
    "Kovaipudur", "Sulur", "Thudiyalur", "Ondipudur",
]

# Fallback placeholder images (Unsplash, royalty-free)
PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop",
]


def parse_price(raw: Any, description: str = "") -> Optional[float]:
    """Convert a raw price value (int, float, or Indian-format string) to INR float."""
    if raw is None:
        raw = _extract_price_from_text(description)
        if raw is None:
            return None

    if isinstance(raw, (int, float)):
        return float(raw)

    price_str = str(raw).lower().replace("rs", "").replace(",", "").strip()
    match = re.search(r"([\d.]+)\s*(crores?|cr|lakhs?|l|lacs?|k|thousands?)", price_str)
    if match:
        return _scale_price(float(match.group(1)), match.group(2))

    nums = re.findall(r"\d+", price_str)
    return float("".join(nums)) if nums else None


def _extract_price_from_text(text: str) -> Optional[str]:
    match = re.search(
        r"(?:price|rs\.?)\s*([\d.]+)\s*(crores?|cr|lakhs?|l|lacs?)",
        text, re.IGNORECASE
    )
    if match:
        return match.group(1) + " " + match.group(2)
    return None


def _scale_price(val: float, unit: str) -> float:
    unit = unit.lower()
    if "cr" in unit or "crore" in unit:
        return val * 10_000_000
    if "lakh" in unit or unit in ("l", "lac", "lacs"):
        return val * 100_000
    if "k" in unit or "thousand" in unit:
        return val * 1_000
    return val


def parse_area(raw: Any, description: str = "") -> Optional[float]:
    """Convert a raw area value to sqft float."""
    if raw is None:
        match = re.search(r"([\d,]+)\s*sq[.\-]?ft", description, re.IGNORECASE)
        raw = match.group(1) if match else None
        if raw is None:
            return None

    if isinstance(raw, (int, float)):
        return float(raw)

    area_str = str(raw).replace(",", "").strip()
    match = re.search(r"([\d.]+)", area_str)
    return float(match.group(1)) if match else None


def parse_int_field(field: Any, pattern: str) -> Optional[int]:
    """Extract an integer from a field using a regex pattern, or direct cast."""
    if field is None:
        return None
    if isinstance(field, (int, float)):
        return int(field)
    match = re.search(pattern, str(field), re.IGNORECASE)
    if match:
        return int(match.group(1))
    digit = re.search(r"(\d+)", str(field))
    return int(digit.group(1)) if digit else None


def detect_locality(title: str, parsed_locality: Optional[str] = None) -> str:
    """Return the best-matching Coimbatore locality name."""
    if parsed_locality:
        for loc in COIMBATORE_LOCALITIES:
            if loc.lower() in parsed_locality.lower():
                return loc
        return parsed_locality

    title_lower = title.lower()
    for loc in COIMBATORE_LOCALITIES:
        if loc.lower() in title_lower:
            return loc
    return "Coimbatore"


def detect_property_type(title: str) -> str:
    t = title.lower()
    if "villa" in t:
        return "Villa"
    if "independent house" in t or "individual house" in t or "bungalow" in t:
        return "Independent House"
    if "plot" in t or "land" in t or "site" in t:
        return "Plot"
    return "Apartment"


def detect_listing_type(title: str, description: str = "") -> str:
    combined = (title + " " + description).lower()
    return "Rent" if "for rent" in combined or " rent " in combined else "Sale"


def detect_bedrooms(title: str, parsed: Optional[Any] = None) -> int:
    val = parse_int_field(parsed, r"(\d+)\s*(?:bhk|bedroom|bed)")
    if val:
        return val
    match = re.search(r"(\d+)\s*(?:bhk|bedroom|bed)", title, re.IGNORECASE)
    return int(match.group(1)) if match else 1


def detect_bathrooms(description: str, parsed: Optional[Any] = None) -> int:
    val = parse_int_field(parsed, r"(\d+)\s*(?:bath|bathroom)")
    if val:
        return val
    match = re.search(r"(\d+)\s*(?:bath|bathroom)", description, re.IGNORECASE)
    return int(match.group(1)) if match else 2


def normalize_common(parsed: dict, source: str) -> dict:
    """
    Build a normalized property document from a parsed dict.
    Works for any scraper — individual normalizers call this then patch any
    source-specific fields.
    """
    title = (parsed.get("title") or "").strip()
    description = parsed.get("description") or ""

    price = parse_price(parsed.get("price"), description)
    area = parse_area(parsed.get("area"), description)
    bedrooms = detect_bedrooms(title, parsed.get("bedrooms"))
    bathrooms = detect_bathrooms(description, parsed.get("bathrooms"))
    locality = detect_locality(title, parsed.get("locality"))
    prop_type = detect_property_type(title)
    listing_type = detect_listing_type(title, description)

    lat = parsed.get("latitude")
    lon = parsed.get("longitude")
    images = parsed.get("images") or []
    if not images:
        images = PLACEHOLDER_IMAGES[:]

    return {
        "title": title,
        "property_type": prop_type,
        "listing_type": listing_type,
        "price": float(price) if price else 0.0,
        "area_sqft": float(area) if area else 0.0,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "latitude": float(lat) if lat else None,
        "longitude": float(lon) if lon else None,
        "locality": locality,
        "locality_name": locality,
        "city": parsed.get("city") or "Coimbatore",
        "state": "Tamil Nadu",
        "source": source,
        "listing_url": parsed.get("listing_url") or "",
        "images": images,
    }
