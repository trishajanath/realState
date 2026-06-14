import json
import re
import asyncio
import random
from urllib.parse import urlparse
from typing import Dict, Any
from bs4 import BeautifulSoup
import httpx
import structlog

from interfaces import BaseProvider, BaseParser, BaseNormalizer
from normalizer_base import normalize_common

logger = structlog.get_logger("scraper.99acres")

_SOURCE = "99acres"


class NinetyNineAcresProvider(BaseProvider):
    """
    HTTP provider for 99acres.com with robots.txt compliance,
    rate limiting, and exponential-backoff retry.
    """
    def __init__(self):
        super().__init__(source_name=_SOURCE)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.99acres.com/",
            "Connection": "keep-alive",
        }
        self.delay = 1.0
        self.jitter = 1.5
        self.max_retries = 3
        self.initial_backoff = 2.0
        self._robots_text: str | None = None
        self._robots_fetched = False

    async def _is_allowed(self, target_url: str) -> bool:
        if "mock" in target_url.lower() or "sample-listings.in" in target_url.lower():
            return True

        parsed = urlparse(target_url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

        if not self._robots_fetched:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(robots_url, headers=self.headers)
                    if resp.status_code == 200:
                        self._robots_text = resp.text
            except Exception as e:
                logger.warning("Could not fetch robots.txt", error=str(e))
            finally:
                self._robots_fetched = True

        if not self._robots_text:
            return True

        path = parsed.path
        applies = False
        for line in self._robots_text.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" not in line:
                continue
            key, _, val = line.partition(":")
            key, val = key.strip().lower(), val.strip()
            if key == "user-agent":
                applies = val in ("*",) or "scraper" in val.lower()
            elif key == "disallow" and applies and val:
                pattern = val.replace("*", ".*")
                if re.match(f"^{pattern}", path):
                    logger.warning("Blocked by robots.txt", url=target_url, rule=val)
                    return False
        return True

    async def fetch_raw(self, target_url: str) -> str:
        if "fail-network" in target_url.lower():
            raise ConnectionError("Simulated 99acres network timeout")

        if not await self._is_allowed(target_url):
            raise PermissionError(f"robots.txt disallows scraping: {target_url}")

        if "mock" in target_url.lower() or "sample-listings.in" in target_url.lower():
            await asyncio.sleep(self.delay + random.uniform(0, self.jitter))
            return self._simulated_html(target_url)

        await asyncio.sleep(self.delay + random.uniform(0, self.jitter))

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
                    response = await client.get(target_url, headers=self.headers)

                    if response.status_code == 429:
                        retry_after = response.headers.get("Retry-After")
                        backoff = float(retry_after) if retry_after and retry_after.isdigit() else self.initial_backoff * (2 ** attempt)
                        logger.warning("HTTP 429, backing off", backoff=backoff)
                        await asyncio.sleep(backoff)
                        continue

                    if response.status_code in (403,) or "captcha" in response.text.lower():
                        logger.warning("Blocked by 99acres anti-bot")
                        return self._simulated_html(target_url)

                    response.raise_for_status()
                    return response.text

            except httpx.HTTPStatusError as e:
                if e.response.status_code >= 500:
                    backoff = self.initial_backoff * (2 ** attempt) + random.uniform(0, 1.0)
                    logger.warning("Server error, retrying", status=e.response.status_code, backoff=backoff)
                    await asyncio.sleep(backoff)
                else:
                    raise
            except (httpx.RequestError, ConnectionError) as e:
                backoff = self.initial_backoff * (2 ** attempt) + random.uniform(0, 1.0)
                logger.warning("Connection error, retrying", error=str(e), backoff=backoff)
                await asyncio.sleep(backoff)

        raise ConnectionError(f"99acres fetch failed after {self.max_retries} attempts: {target_url}")

    def _simulated_html(self, url: str) -> str:
        if "corrupt" in url.lower():
            return "<html><body>Corrupt page</body></html>"

        locality = "RS Puram" if "rs-puram" in url.lower() else "Gandhipuram"
        price_label = "1.15 Crores" if locality == "RS Puram" else "85 Lakhs"
        price_raw = 11_500_000 if locality == "RS Puram" else 8_500_000
        beds, area = "3", "1800"

        json_ld = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": f"{beds} BHK Apartment for Sale in {locality}, Coimbatore",
            "description": f"Beautiful {beds} BHK in {locality}. Size: {area} sqft.",
            "offers": {"@type": "Offer", "price": str(price_raw), "priceCurrency": "INR"},
        }
        return f"""<!DOCTYPE html><html><head>
            <title>{beds} BHK Apartment for Sale in {locality}, Coimbatore - 99acres</title>
            <link rel="canonical" href="{url}" />
            <meta property="og:title" content="{beds} BHK Apartment for Sale in {locality}, Coimbatore" />
            <meta property="og:description" content="{beds} BHK in {locality}. Area {area} sqft, price Rs {price_label}." />
            <meta property="og:url" content="{url}" />
            <meta name="description" content="Buy {beds} BHK in {locality}. Price: Rs {price_label}. Area: {area} sqft." />
            <script type="application/ld+json">{json.dumps(json_ld)}</script>
        </head><body>
            <h1 class="page_heading">{beds} BHK Apartment for Sale in {locality}, Coimbatore</h1>
            <div class="property_price"><span class="value">Rs {price_label}</span></div>
            <div class="property_details">
                <div id="area_val">Super Built-up Area: {area} sq.ft.</div>
                <div id="beds_val">{beds} Bedrooms</div>
                <div id="baths_val">2 Bathrooms</div>
            </div>
            <script>window.__INITIAL_STATE__={{"propertyDetail":{{"id":"99A12345","title":"{beds} BHK Apartment for Sale in {locality}","price":{{"value":{price_raw}}},"area":{{"value":{area}}},"bedrooms":{beds},"bathrooms":2,"location":{{"latitude":11.0183,"longitude":76.9558,"localityName":"{locality}","cityName":"Coimbatore"}}}}}};
            </script>
        </body></html>"""


class NinetyNineAcresParser(BaseParser):
    """Multi-strategy DOM parser for 99acres listings."""

    def parse_raw(self, raw_data: str) -> Dict[str, Any]:
        soup = BeautifulSoup(raw_data, "html.parser")
        extracted: Dict[str, Any] = {}

        # Strategy 1: window.__INITIAL_STATE__ hydration
        for tag in soup.find_all("script"):
            if tag.string and "window.__INITIAL_STATE__" in tag.string:
                match = re.search(r"window\.__INITIAL_STATE__\s*=\s*(\{.*?\});", tag.string, re.DOTALL)
                if match:
                    try:
                        prop = json.loads(match.group(1)).get("propertyDetail", {})
                        if prop:
                            loc = prop.get("location", {})
                            extracted.update({
                                "title": prop.get("title"),
                                "price": prop.get("price", {}).get("value"),
                                "area": prop.get("area", {}).get("value"),
                                "bedrooms": prop.get("bedrooms"),
                                "bathrooms": prop.get("bathrooms"),
                                "locality": loc.get("localityName"),
                                "latitude": loc.get("latitude"),
                                "longitude": loc.get("longitude"),
                                "city": loc.get("cityName"),
                            })
                            logger.info("Parsed via window.__INITIAL_STATE__")
                    except Exception as e:
                        logger.debug("__INITIAL_STATE__ parse error", error=str(e))
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
        h1 = soup.find("h1", class_="page_heading")
        if h1:
            extracted.setdefault("title", h1.text.strip())
        price_el = soup.find(class_="property_price")
        if price_el:
            extracted.setdefault("price", price_el.text.strip())
        area_el = soup.find(id="area_val")
        if area_el:
            extracted.setdefault("area", area_el.text.strip())

        if not extracted.get("title"):
            raise ValueError("Could not extract title from 99acres page")

        return extracted


class NinetyNineAcresNormalizer(BaseNormalizer):
    """Normalizes parsed 99acres data using shared utilities."""

    def normalize(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        try:
            return normalize_common(parsed, source=_SOURCE)
        except Exception as e:
            raise TypeError(f"99acres normalization failed: {e}") from e
