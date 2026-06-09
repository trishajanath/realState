import json
import httpx
from typing import List, Dict, Any, Optional
from config import settings
import structlog

logger = structlog.get_logger("recommendation.ai")


class AIService:
    """
    Integrates with Google Gemini API to dynamically generate Similar Locality Recommendations.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    async def _query_gemini(self, prompt: str) -> Optional[str]:
        """
        Issues an async POST request to the Gemini API endpoint.
        """
        if not self.api_key or "secure" in self.api_key or self.api_key == "AIzaSyDC_Obdu6DGqdB_x3YqOrz8KXi8Lmd6Zzc":
            logger.warning("Gemini API key is not configured or using default placeholder. Skipping AI recommendation query.")
            return None

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(self.endpoint, json=payload)
                response.raise_for_status()
                response_json = response.json()
                
                candidates = response_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
            
            logger.warning("Empty response received from Gemini API.")
            return None
        except Exception as e:
            logger.error("Failed to query Gemini API for recommendations", error=str(e))
            return None

    async def generate_recommendations(
        self,
        target: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        recommendation_type: str,
        limit: int = 5
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Asks Gemini to analyze and recommend the best localities based on target and candidates.
        """
        # Exclude target from candidates list
        filtered_candidates = [c for c in candidates if str(c["locality_id"]) != str(target["locality_id"])]
        if not filtered_candidates:
            return []

        prompt = (
            f"You are a production-grade real estate analytics engine for Coimbatore, Tamil Nadu, India.\n"
            f"Your task is to recommend the top {limit} alternative localities from a list of candidates "
            f"that best match the recommendation type '{recommendation_type}' for a target locality.\n\n"
            f"Target Locality:\n"
            f"- ID: {target['locality_id']}\n"
            f"- Name: {target['name']}\n"
            f"- Features: {target['raw_features']}\n\n"
            f"Candidate Localities:\n"
        )
        for cand in filtered_candidates:
            prompt += f"- ID: {cand['locality_id']}, Name: {cand['name']}, Features: {cand['raw_features']}\n"

        prompt += (
            f"\nIdentify the top {limit} localities that are the best candidates for type '{recommendation_type}'.\n"
            f"Definitions of recommendation types:\n"
            f"- SIMILAR: Closest overall feature vector match.\n"
            f"- CHEAPER: Similar scores/amenities but at least 15% lower price per sqft than the target.\n"
            f"- PREMIUM: Higher price per sqft but with significantly higher livability (connectivity, education, healthcare, lifestyle) scores.\n"
            f"- HIGH_GROWTH: Localities with high investment score and rental yield.\n"
            f"- FAMILY_FRIENDLY: Localities with high education, healthcare, lifestyle scores, and high amenity density.\n"
            f"- SAFER: Localities with high healthcare, lifestyle, and education metrics (often associated with safety/amenities).\n"
            f"- BETTER_CONNECTED: Localities with higher connectivity score than the target, while keeping other attributes similar.\n\n"
            f"Return your answer as a JSON array of objects. Do not include markdown wraps or code block backticks. The JSON structure MUST be strictly as follows:\n"
            f"[\n"
            f"  {{\n"
            f"    \"recommended_locality_id\": \"UUID-string\",\n"
            f"    \"score\": 0.95,\n"
            f"    \"reasoning\": \"A short, human-friendly explainable text comparing specific features (e.g. connectivity, price savings) of this locality to the target.\",\n"
            f"    \"feature_contribution\": {{\n"
            f"      \"price_per_sqft\": 0.1,\n"
            f"      \"education_score\": 0.2,\n"
            f"      \"healthcare_score\": 0.2,\n"
            f"      \"lifestyle_score\": 0.1,\n"
            f"      \"connectivity_score\": 0.2,\n"
            f"      \"investment_score\": 0.1,\n"
            f"      \"amenity_density\": 0.1,\n"
            f"      \"property_inventory\": 0.0,\n"
            f"      \"rental_yield\": 0.0\n"
            f"    }}\n"
            f"  }}\n"
            f"]\n"
            f"Do not return any other text besides the JSON array."
        )

        response_text = await self._query_gemini(prompt)
        if not response_text:
            return None

        # Clean potential markdown wrappers
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()

        try:
            recs = json.loads(response_text)
            if not isinstance(recs, list):
                logger.error("Gemini response is not a list", content=response_text)
                return None

            validated_recs = []
            for rec in recs:
                rec_id_str = rec.get("recommended_locality_id")
                score = rec.get("score", 0.0)
                reasoning = rec.get("reasoning", "")
                feature_contrib = rec.get("feature_contribution", {})

                if not rec_id_str:
                    continue

                validated_recs.append({
                    "target_locality_id": target["locality_id"],
                    "recommended_locality_id": rec_id_str,
                    "recommendation_type": recommendation_type,
                    "score": float(score),
                    "reasoning": str(reasoning),
                    "feature_contribution": feature_contrib
                })

            return validated_recs
        except Exception as e:
            logger.error("Failed to parse Gemini recommendations JSON", error=str(e), content=response_text)
            return None


ai_service = AIService()
