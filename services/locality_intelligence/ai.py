import os
from typing import Optional, List, Dict, Any
import httpx
import structlog

from config import settings

logger = structlog.get_logger("locality.ai")


class AIService:
    """
    Integrates with Google Gemini API to dynamically generate real estate neighborhood
    reviews for localities in Coimbatore, Tamil Nadu, India.
    """
    def __init__(self):
        # settings.model_config includes GEMINI_API_KEY from root .env if defined
        self.api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY"))
        # Fallback check if settings didn't load it
        if not self.api_key:
            # Let's search environment variables and load
            import os
            self.api_key = os.getenv("GEMINI_API_KEY", "AIzaSyDC_Obdu6DGqdB_x3YqOrz8KXi8Lmd6Zzc")
            
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
        
        # If API key is placeholder, skip API call
        if not self.api_key or "secure" in self.api_key or self.api_key == "AIzaSyDC_Obdu6DGqdB_x3YqOrz8KXi8Lmd6Zzc":
            logger.warning("Gemini API key is not configured or using default placeholder. Skipping AI enrichment.")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
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
            logger.error("Failed to query Gemini API", error=str(e))
            return None

    async def generate_locality_review(
        self,
        name: str,
        relative_price: float,
        overall_livability: float,
        projected_appreciation: float,
        planned_projects: List[Dict[str, Any]],
        scores: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Generates a professional neighborhood review analyzing relative price, infra quality,
        developments, projected appreciation and key scores.
        """
        projects_str = ", ".join([p.get("project_name", "") for p in planned_projects]) if planned_projects else "No major planned infrastructure projects tracked."
        
        prompt = (
            f"Perform a professional real estate neighborhood evaluation for the locality '{name}' "
            f"in Coimbatore, Tamil Nadu, India.\n\n"
            f"Locality: {name}\n"
            f"Relative Price vs Coimbatore Avg: {relative_price:.2f}x\n"
            f"Infrastructure/Livability Quality Index: {overall_livability:.1f}/100\n"
            f"Projected Annual Appreciation Rate: {projected_appreciation:.1f}%\n"
            f"Infrastructure Developments / Planned Projects: {projects_str}\n"
            f"Key Score Indices:\n"
            f"- Education Score: {scores.get('education_score', 70):.1f}/100\n"
            f"- Healthcare Score: {scores.get('healthcare_score', 70):.1f}/100\n"
            f"- Lifestyle Score: {scores.get('lifestyle_score', 70):.1f}/100\n"
            f"- Connectivity Score: {scores.get('connectivity_score', 70):.1f}/100\n"
            f"- Investment Rating Score: {scores.get('investment_score', 70):.1f}/100\n\n"
            f"Provide a structured neighborhood review consisting of:\n"
            f"1. A professional summary (under 120 words) analyzing the investment potential and livability context of {name} in Coimbatore.\n"
            f"2. Three bullet points representing Core Strengths.\n"
            f"3. Two bullet points representing Key Risk Factors/Constraints.\n\n"
            f"Strictly format your response as a valid JSON object matching this schema:\n"
            f"{{\n"
            f"  \"summary\": \"[Review text]\",\n"
            f"  \"strengths\": [\"Strength 1\", \"Strength 2\", \"Strength 3\"],\n"
            f"  \"risks\": [\"Risk 1\", \"Risk 2\"]\n"
            f"}}\n"
            f"Do not include any markdown format blocks or code tags. Output only raw JSON."
        )

        ai_review_raw = await self._query_gemini(prompt)
        
        # Clean response if markdown block wrapper is returned by chance
        if ai_review_raw:
            cleaned = ai_review_raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            try:
                import json
                return json.loads(cleaned)
            except Exception as e:
                logger.error("Failed to parse Gemini JSON output, falling back to mock review", error=str(e), raw_output=ai_review_raw)

        # Fallback structured mock response if Gemini offline or invalid
        appreciation_desc = "high" if projected_appreciation > 6.0 else "stable"
        price_desc = "premium" if relative_price > 1.1 else "affordable"
        
        return {
            "summary": (
                f"{name} is a {price_desc} residential hotspot in Coimbatore, offering {appreciation_desc} "
                f"appreciation potential of {projected_appreciation:.1f}% annually. It boasts a livability rating of "
                f"{overall_livability:.1f}/100, driven by its infrastructure framework. The planned developments, "
                f"including '{projects_str}', are set to further boost connectivity and property valuations, "
                f"making it a popular choice for families and IT professionals alike."
            ),
            "strengths": [
                f"Strong capital appreciation potential projected at {projected_appreciation:.1f}% per annum.",
                f"Excellent infrastructure development pipeline with upcoming projects like {planned_projects[0].get('project_name', 'Bypass expansion') if planned_projects else 'TIDEL Park Phase-II'}.",
                f"High-quality local civic amenities with solid healthcare/education accessibility indexes."
            ],
            "risks": [
                "Rising traffic congestion bottlenecks around main connecting corridors during peak commuter hours.",
                "Slight pricing premium relative to surrounding peripheral micro-markets."
            ]
        }
