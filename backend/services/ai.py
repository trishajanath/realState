from typing import Optional
import httpx

from core.config import settings
from core.logging import logger


class AIService:
    """
    Integrates with Google Gemini API to dynamically generate property listing 
    descriptions and investment analysis reviews.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    async def _query_gemini(self, prompt: str) -> Optional[str]:
        """
        Helper method to issue an async POST request to the Gemini API endpoint.
        """
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ]
        }
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not configured. Skipping AI enrichment.")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.endpoint, json=payload)
                response.raise_for_status()
                response_json = response.json()
                
                # Extract generated text candidate
                candidates = response_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
            
            logger.warning("Empty response received from Gemini API.")
            return None
        except Exception as e:
            logger.error("Failed to query Gemini API", error=str(e))
            return None

    async def generate_property_description(
        self,
        title: str,
        property_type: str,
        listing_type: str,
        price: float,
        area_sqft: float,
        locality_name: str
    ) -> str:
        """
        Generates an enriched, appealing description of a property in Coimbatore.
        """
        prompt = (
            f"Generate a professional and compelling real estate marketing description (under 150 words) "
            f"for a property listing in Coimbatore, Tamil Nadu, India.\n"
            f"Listing Title: '{title}'\n"
            f"Property Type: {property_type}\n"
            f"Offer: For {listing_type}\n"
            f"Price: {price:,} INR\n"
            f"Area size: {area_sqft:,} sqft\n"
            f"Locality: {locality_name}\n"
            f"Incorporate local context if relevant (e.g. IT park proximity, schools, local transit like Gandhipuram/Peelamedu). "
            f"Focus on appealing attributes without making false assertions."
        )
        
        ai_description = await self._query_gemini(prompt)
        if not ai_description:
            # Fallback placeholder description
            ai_description = (
                f"Premium {property_type} located in the heart of {locality_name}, Coimbatore. "
                f"Spanning {area_sqft:,} sqft, this {listing_type.lower()} listing is priced at {price:,} INR. "
                f"An excellent opportunity for investors and home buyers alike."
            )
        return ai_description

    async def evaluate_property_deal(
        self,
        property_type: str,
        price: float,
        area_sqft: float,
        locality_name: str
    ) -> str:
        """
        Evaluates the property deal to output an investment rating score.
        """
        prompt = (
            f"Analyze the pricing deal metrics of this property in Coimbatore, Tamil Nadu, India:\n"
            f"Property Type: {property_type}\n"
            f"Price: {price:,} INR\n"
            f"Area size: {area_sqft:,} sqft\n"
            f"Locality: {locality_name}\n\n"
            f"Provide an investment grade (e.g., 'A - High Potential', 'B - Fair Value', 'C - Speculative') "
            f"and a one-sentence logical analysis of the price-to-size ratio in Coimbatore market context.\n"
            f"Output must be strictly formatted as: 'Grade: [Grade] | Analysis: [One sentence analysis]'"
        )

        ai_review = await self._query_gemini(prompt)
        if not ai_review:
            # Fallback valuation rating
            price_per_sqft = price / area_sqft if area_sqft > 0 else 0
            ai_review = f"Grade: B - Standard | Analysis: Estimated price of {price_per_sqft:,.2f} INR/sqft represents market standard rates for {locality_name}."
        return ai_review
