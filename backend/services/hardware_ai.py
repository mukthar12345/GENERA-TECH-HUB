"""Hardware support assistant used by the public AI endpoint.

The local engine is deliberately useful without a paid model: it classifies
common hardware questions, asks for missing device context, gives safe
diagnostic steps, and can use live product data supplied by the route.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Iterable


@dataclass(frozen=True)
class HardwareContext:
    brand: str | None = None
    model: str | None = None
    device_type: str | None = None
    operating_system: str | None = None


DEVICE_TERMS = {
    "phone": ("phone", "iphone", "android", "smartphone", "mobile"),
    "laptop": ("laptop", "notebook", "macbook"),
    "tablet": ("tablet", "ipad", "galaxy tab"),
    "desktop": ("desktop", "pc", "computer", "tower"),
    "console": ("playstation", "ps4", "ps5", "xbox", "nintendo", "console"),
    "accessory": ("charger", "cable", "power bank", "headphone", "earbuds"),
}

BRANDS = ("apple", "samsung", "tecno", "infinix", "xiaomi", "google", "hp", "dell", "lenovo", "asus", "acer", "microsoft")


def _contains_any(text: str, terms: Iterable[str]) -> bool:
    return any(term in text for term in terms)


def detect_context(message: str) -> HardwareContext:
    text = message.lower()
    device_type = next((name for name, terms in DEVICE_TERMS.items() if _contains_any(text, terms)), None)
    brand = next((brand for brand in BRANDS if brand in text), None)
    operating_system = next((system for system in ("ios", "android", "windows", "macos", "linux", "chromeos") if system in text), None)
    model_match = re.search(r"\b(?:iphone|galaxy|pixel|redmi|macbook|thinkpad|surface|ps[45]|xbox)\s?[a-z0-9 -]{1,24}", text, re.IGNORECASE)
    return HardwareContext(brand=brand, model=model_match.group(0).strip() if model_match else None, device_type=device_type, operating_system=operating_system)


def _device_label(context: HardwareContext) -> str:
    return context.model or context.device_type or "your device"


def answer_hardware_question(message: str, products: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Return a structured, safe answer for a hardware question."""
    cleaned = " ".join(message.strip().split())
    if not cleaned:
        return {"answer": "Tell me the device and the problem, for example: 'My Samsung phone is overheating while charging.'", "intent": "clarification", "context": {}}

    text = cleaned.lower()
    context = detect_context(cleaned)
    label = _device_label(context)

    if _contains_any(text, ("won't turn on", "wont turn on", "no power", "dead", "not powering")):
        answer = (f"For {label}, first disconnect accessories and hold the power button for 15-20 seconds. "
                  "Try a known-good charger and wall socket for 30 minutes, then retry. "
                  "If there is no charging icon, unusual heat, liquid exposure, or swelling, stop charging and use a technician.")
        intent = "power_failure"
    elif _contains_any(text, ("overheat", "hot", "heating", "temperature")):
        answer = (f"For {label}, stop intensive apps, remove the case, move it out of direct sun, and let it cool naturally. "
                  "Do not put it in a freezer. Check whether heat happens only during charging or all the time. "
                  "Swelling, a burning smell, or heat while idle requires immediate professional inspection.")
        intent = "overheating"
    elif _contains_any(text, ("battery", "drain", "charge", "charging")):
        answer = (f"For {label}, test another certified cable and adapter, inspect the port for lint without using metal, "
                  "and compare battery drain in safe mode or after a restart. Battery health below about 80%, swelling, "
                  "or shutdowns under load are signs to arrange a replacement assessment.")
        intent = "battery"
    elif _contains_any(text, ("slow", "lag", "freeze", "hang", "stutter")):
        answer = (f"For {label}, restart first, keep at least 10-15% storage free, update the operating system, "
                  "and check which app or task uses the most CPU, memory, or disk. Persistent lag after a clean backup "
                  "may indicate storage or thermal hardware failure.")
        intent = "performance"
    elif _contains_any(text, ("screen", "display", "black", "touch", "flicker")):
        answer = (f"For {label}, record whether the device still makes sounds or responds to buttons. Restart it, "
                  "test brightness and an external display where supported, and back up data if the screen works intermittently. "
                  "Cracks, liquid damage, dead zones, or flickering should be assessed before continued use.")
        intent = "display"
    elif _contains_any(text, ("wifi", "wi-fi", "bluetooth", "network", "internet")):
        answer = (f"For {label}, toggle the connection, restart the device and router, forget and re-add the network, "
                  "and test another network. If other devices work but this one does not, update drivers or network settings; "
                  "persistent failure may need an antenna or board diagnosis.")
        intent = "connectivity"
    elif _contains_any(text, ("buy", "recommend", "best", "price", "available", "stock", "compare")):
        matches = products or []
        if matches:
            names = ", ".join(str(item.get("name", "device")) for item in matches[:5])
            answer = f"Based on our current catalogue, these may fit your request: {names}. Tell me your budget, use case, and preferred brand for a narrower recommendation."
        else:
            answer = "I can recommend a device if you share your budget, main use (gaming, school, business, camera), preferred operating system, and storage needs."
        intent = "recommendation"
    elif _contains_any(text, ("repair", "broken", "damage", "fix", "technician")):
        answer = (f"I can help narrow the fault on {label}. Tell me what happened immediately before the issue, "
                  "whether it powers on, and whether it suffered a drop or liquid exposure. Do not keep using a device with swelling, smoke, sparks, or a burning smell.")
        intent = "repair_triage"
    else:
        answer = (f"I can help diagnose {label}, compare hardware, explain specifications, or prepare a repair request. "
                  "Include the brand/model, symptoms, when it started, and any drop, liquid, heat, or recent update involved.")
        intent = "clarification"

    return {"answer": answer, "intent": intent, "context": context.__dict__}