from typing import Dict, Any
from interfaces import BaseProvider, BaseParser, BaseNormalizer


class SampleProvider(BaseProvider):
    """
    Simulated implementation of BaseProvider.
    Fetches mock HTML string or triggers connection errors based on URLs.
    """
    def __init__(self):
        super().__init__(source_name="SampleMockSource")

    async def fetch_raw(self, target_url: str) -> str:
        # Simulate network error if 'fail' is present in URL
        if "fail" in target_url.lower():
            raise ConnectionError("Simulated Provider Connection Timeout (HTTP 504)")

        # Simulate layout corruption if 'corrupt' is present in URL
        if "corrupt" in target_url.lower():
            return "<html><body>corrupt data payload</body></html>"
        return """
        <html>
            <head><title>Mock Listing Page</title></head>
            <body>
                <div class="header">
                    <h1 id="title">Luxury 3 BHK Apartment Gandhipuram</h1>
                </div>
                <div class="details">
                    <span class="price">INR 12,000,000</span>
                    <span class="area">2200 sqft</span>
                    <span class="bedrooms">3 bedrooms</span>
                </div>
            </body>
        </html>
        """


class SampleParser(BaseParser):
    """
    Simulated parser extracting dictionary fields from HTML.
    Triggers parsing value exceptions if input is set to corrupt formats.
    """
    def parse_raw(self, raw_data: str) -> Dict[str, Any]:
        # Simulate layout drift parsing failure if 'corrupt' is present
        if "corrupt" in raw_data.lower():
            raise ValueError("Simulated Parsing Failure: DOM layout drift detected. Missing 'title' block.")

        try:
            # Emulate light text-seeking parsing (mimicking BeautifulSoup parser)
            title_start = raw_data.find('id="title">') + 11
            title_end = raw_data.find('</h1>', title_start)
            title_val = raw_data[title_start:title_end].strip()

            price_start = raw_data.find('class="price">') + 14
            price_end = raw_data.find('</span>', price_start)
            price_val = raw_data[price_start:price_end].strip()

            area_start = raw_data.find('class="area">') + 13
            area_end = raw_data.find('</span>', area_start)
            area_val = raw_data[area_start:area_end].strip()

            beds_start = raw_data.find('class="bedrooms">') + 17
            beds_end = raw_data.find('</span>', beds_start)
            beds_val = raw_data[beds_start:beds_end].strip()

            return {
                "title": title_val,
                "price": price_val,
                "area": area_val,
                "bedrooms": beds_val
            }
        except Exception as e:
            raise ValueError(f"Parsing failed: Missing target nodes: {str(e)}")


class SampleNormalizer(BaseNormalizer):
    """
    Simulated normalizer casting raw string details to clean schemas.
    """
    def normalize(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Clean and cast Price
            raw_price = parsed_data["price"].replace("INR", "").replace(",", "").strip()
            price_num = float(raw_price)

            # Clean and cast Area
            raw_area = parsed_data["area"].replace("sqft", "").strip()
            area_num = float(raw_area)

            # Clean and cast Bedrooms count
            raw_beds = parsed_data["bedrooms"].replace("bedrooms", "").strip()
            beds_num = int(raw_beds)

            return {
                "title": parsed_data["title"],
                "property_type": "Apartment",
                "listing_type": "Sale",
                "price": price_num,
                "area_sqft": area_num,
                "bedrooms": beds_num,
                "city": "Coimbatore",
                "state": "Tamil Nadu"
            }
        except Exception as e:
            raise TypeError(f"Normalization validation failed: {str(e)}")
