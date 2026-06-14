import json
import re
from typing import Dict, Any
from bs4 import BeautifulSoup
import httpx
import structlog

from interfaces import BaseProvider, BaseParser, BaseNormalizer
from normalizer_base import normalize_common

logger = structlog.get_logger("scraper.magicbricks")

_SOURCE = "magicbricks"


class MagicBricksProvider(BaseProvider):
    """
    HTTP provider for MagicBricks.com.
    Falls back to a local HTML simulation when blocked or running offline.
    """
    def __init__(self):
        super().__init__(source_name=_SOURCE)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.magicbricks.com/",
            "Connection": "keep-alive",
        }

    async def fetch_raw(self, target_url: str) -> str:
        if "fail-network" in target_url.lower():
            raise ConnectionError("Simulated MagicBricks network timeout")

        if "mock" in target_url.lower() or "sample-listings.in" in target_url.lower():
            logger.info("Using MagicBricks simulation", url=target_url)
            return self._simulated_html(target_url)

        logger.info("Fetching MagicBricks listing", url=target_url)
        try:
            async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
                response = await client.get(target_url, headers=self.headers)
                if response.status_code in (403, 429) or "captcha" in response.text.lower():
                    logger.warning("Blocked by MagicBricks anti-bot", status_code=response.status_code)
                    return self._simulated_html(target_url)
                response.raise_for_status()
                return response.text
        except Exception as e:
            logger.warning("MagicBricks fetch failed, using simulation", error=str(e))
            return self._simulated_html(target_url)

    def _simulated_html(self, url: str) -> str:
        if "corrupt" in url.lower():
            return "<html><body>Corrupt page</body></html>"

        locality = "RS Puram" if "rs-puram" in url.lower() else "Gandhipuram"
        price_label = "1.30 Crore" if locality == "RS Puram" else "78 Lakh"
        price_raw = 13_000_000 if locality == "RS Puram" else 7_800_000
        beds, area = "3", "1950"

        json_ld = {
            "@context": "https://schema.org",
            "@type": "SingleFamilyResidence",
            "name": f"{beds} BHK Multistorey Apartment for Sale in {locality}, Coimbatore",
            "description": f"Excellent {beds} BHK ready-to-move flat in {locality}, Coimbatore. Built up area {area} sqft.",
            "offers": {"@type": "Offer", "price": str(price_raw), "priceCurrency": "INR"},
        }
        return f"""<!DOCTYPE html><html><head>
            <title>{beds} BHK Apartment for Sale in {locality}, Coimbatore - Magicbricks</title>
            <link rel="canonical" href="{url}" />
            <meta property="og:title" content="{beds} BHK Apartment for Sale in {locality}, Coimbatore" />
            <meta property="og:description" content="{beds} BHK Apartment in {locality}. Area {area} sqft, price Rs {price_label}." />
            <meta property="og:url" content="{url}" />
            <meta name="description" content="Buy {beds} BHK in {locality}. Price: Rs {price_label}. Area: {area} sqft." />
            <script type="application/ld+json">{json.dumps(json_ld)}</script>
        </head><body>
            <h1 class="mb-ld-title">{beds} BHK Multistorey Apartment for Sale in {locality}, Coimbatore</h1>
            <div class="mb-ld-price"><span class="value">Rs {price_label}</span></div>
            <div class="mb-ld-details">
                <div class="mb-ld-item" data-type="area">Super Area: {area} Sq-ft</div>
                <div class="mb-ld-item" data-type="bedrooms">{beds} BHK</div>
                <div class="mb-ld-item" data-type="bathrooms">2 Baths</div>
            </div>
            <script>window.magicbricks={{"property":{{"id":"MB54321","title":"{beds} BHK Apartment for Sale in {locality}","price":{{"value":{price_raw},"label":"Rs {price_label}"}},"superArea":{area},"beds":{beds},"baths":2,"geo":{{"lat":11.0183,"lng":76.9558}},"locality":"{locality}","city":"Coimbatore"}}}};
            </script>
        </body></html>"""


class MagicBricksParser(BaseParser):
    """Multi-strategy DOM parser for MagicBricks listings."""

    def parse_raw(self, raw_data: str) -> Dict[str, Any]:
        soup = BeautifulSoup(raw_data, "html.parser")
        extracted: Dict[str, Any] = {}

        # Strategy 1: window.magicbricks hydration state
        for tag in soup.find_all("script"):
            if tag.string and "window.magicbricks" in tag.string:
                match = re.search(r"window\.magicbricks\s*=\s*(\{.*?\});", tag.string, re.DOTALL)
                if match:
                    try:
                        prop = json.loads(match.group(1)).get("property", {})
                        if prop:
                            extracted.update({
                                "title": prop.get("title"),
                                "price": prop.get("price", {}).get("value"),
                                "area": prop.get("superArea") or prop.get("coverArea"),
                                "bedrooms": prop.get("beds"),
                                "bathrooms": prop.get("baths"),
                                "locality": prop.get("locality"),
                                "latitude": prop.get("geo", {}).get("lat"),
                                "longitude": prop.get("geo", {}).get("lng"),
                                "city": prop.get("city"),
                            })
                            logger.info("Parsed via window.magicbricks")
                    except Exception as e:
                        logger.debug("window.magicbricks parse error", error=str(e))
                break

        # Strategy 2: JSON-LD schema
        if not extracted.get("title") or not extracted.get("price"):
            for ld in soup.find_all("script", type="application/ld+json"):
                if not ld.string:
                    continue
                try:
                    data = json.loads(ld.string)
                    if isinstance(data, dict) and data.get("@type") in ("Product", "Accommodation", "SingleFamilyResidence"):
                        extracted.setdefault("title", data.get("name"))
                        extracted.setdefault("description", data.get("description"))
                        offers = data.get("offers", {})
                        if isinstance(offers, dict):
                            extracted.setdefault("price", offers.get("price"))
                        logger.info("Parsed via JSON-LD")
                        break
                except Exception as e:
                    logger.debug("JSON-LD parse error", error=str(e))

        # Strategy 3: OpenGraph / meta tags
        og_title = soup.find("meta", attrs={"property": "og:title"})
        if og_title:
            extracted.setdefault("title", og_title.get("content"))
        meta_desc = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        if meta_desc:
            extracted.setdefault("description", meta_desc.get("content"))
        canonical = soup.find("link", attrs={"rel": "canonical"}) or soup.find("meta", attrs={"property": "og:url"})
        if canonical:
            extracted.setdefault("listing_url", canonical.get("href") or canonical.get("content"))
        og_img = soup.find("meta", attrs={"property": "og:image"})
        if og_img and og_img.get("content"):
            extracted.setdefault("images", [og_img["content"]])

        # Strategy 4: DOM classes fallback
        h1 = soup.find("h1", class_="mb-ld-title")
        if h1:
            extracted.setdefault("title", h1.text.strip())
        price_el = soup.find(class_="mb-ld-price")
        if price_el:
            extracted.setdefault("price", price_el.text.strip())
        area_el = soup.find(class_="mb-ld-item", attrs={"data-type": "area"})
        if area_el:
            extracted.setdefault("area", area_el.text.strip())

        if not extracted.get("title"):
            raise ValueError("Could not extract title from MagicBricks page")

        return extracted


class MagicBricksNormalizer(BaseNormalizer):
    """Normalizes parsed MagicBricks data using shared utilities."""

    def normalize(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        try:
            return normalize_common(parsed, source=_SOURCE)
        except Exception as e:
            raise TypeError(f"MagicBricks normalization failed: {e}") from e
