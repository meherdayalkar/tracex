"""
Legal Metrology (Packaged Commodities) Rules, 2011 - Rules Engine
Project [TraceX] (SIH26034) - Department of Consumer Affairs (DoCA)

Pure, decoupled statutory checks. Each function returns:
{
    "rule_id": str,
    "rule_description": str,
    "status": "pass" | "fail",
    "reason": str,
    "severity": "violation" | "advisory",
    "citation": str
}
"""

import re
from typing import Dict, Any, List

def check_rule_6_1_a_manufacturer(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rule 6(1)(a): Name and complete address of the manufacturer, packer, or importer.
    Requires full address (not just city) with 6-digit postal PIN code.
    """
    rule_id = "rule_6_1_a"
    rule_desc = "Manufacturer / Packer / Importer Name & Complete Address"
    citation = "Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011"

    mfg_name = (data.get("manufacturer_name") or "").strip()
    mfg_addr = (data.get("manufacturer_address") or "").strip()

    if not mfg_name:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Manufacturer or Packer name is missing from packaging declarations.",
            "severity": "violation",
            "citation": citation
        }

    if not mfg_addr:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Manufacturer address is missing.",
            "severity": "violation",
            "citation": citation
        }

    # Check for 6-digit Indian PIN code (e.g. 560066, 700 020)
    has_pin = bool(re.search(r'\b[1-9][0-9]{2}\s?[0-9]{3}\b', mfg_addr)) or data.get("has_pin_code", False)
    
    # Check address completeness: more than a single word/city
    addr_words = [w for w in re.split(r'[\s,.-]+', mfg_addr) if len(w) > 1]
    is_sufficiently_detailed = len(addr_words) >= 3

    if not has_pin:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Address is legally incomplete: missing mandatory 6-digit Indian postal PIN code.",
            "severity": "violation",
            "citation": citation
        }

    if not is_sufficiently_detailed:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Address declaration is vague (only city/area given without street/plot details).",
            "severity": "violation",
            "citation": citation
        }

    return {
        "rule_id": rule_id,
        "rule_description": rule_desc,
        "status": "pass",
        "reason": f"Manufacturer declaration verified with complete address & PIN code: '{mfg_name}'.",
        "severity": "violation",
        "citation": citation
    }

def check_rule_6_1_b_net_quantity(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rule 6(1)(b) & Rule 12: Net quantity in standard metric units.
    Flags non-metric units (e.g. 'lb', 'oz') and illegal non-standard metric symbols (e.g. 'gms', 'gm').
    """
    rule_id = "rule_6_1_b"
    rule_desc = "Net Quantity in Standard Metric Units"
    citation = "Rule 6(1)(b) & Rule 12, Legal Metrology (Packaged Commodities) Rules, 2011"

    net_qty = data.get("net_quantity") or {}
    val = net_qty.get("value")
    unit = (net_qty.get("unit") or "").strip().lower()

    if val is None or val <= 0:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Net quantity is missing or declared with zero value.",
            "severity": "violation",
            "citation": citation
        }

    # Prohibited non-metric units
    non_metric_units = {"lb", "lbs", "oz", "fl oz", "pound", "pounds", "ounce", "ounces", "pint", "quart", "gallon"}
    if unit in non_metric_units:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": f"Non-metric unit '{unit}' is illegal in India. Legal Metrology mandates SI units (g, kg, ml, l).",
            "severity": "violation",
            "citation": citation
        }

    # Prohibited non-standard metric notations under Rule 12
    non_standard_metric = {"gms", "gm", "grm", "grams", "kilos", "ml.", "ltrs", "ltr", "litres"}
    if unit in non_standard_metric:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": f"Non-standard metric abbreviation '{unit}'. Rule 12 prohibits pluralization ('s') and unapproved symbols; use only 'g', 'kg', 'ml', or 'l'.",
            "severity": "violation",
            "citation": citation
        }

    # Standard valid metric symbols
    valid_metric = {"g", "kg", "ml", "l", "u", "n", "piece", "pieces", "gram", "kilogram", "milliliter", "liter", "लीटर", "ग्राम", "किग्रा", "मिली"}
    if unit in valid_metric:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "pass",
            "reason": f"Standard metric net quantity declared: {val} {unit}.",
            "severity": "violation",
            "citation": citation
        }

    return {
        "rule_id": rule_id,
        "rule_description": rule_desc,
        "status": "fail",
        "reason": f"Unrecognized or non-standard quantity unit '{unit}'.",
        "severity": "violation",
        "citation": citation
    }

def check_rule_6_1_f_mrp_tax(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rule 6(1)(e) & Rule 6(1)(f): Maximum Retail Price (MRP) & Tax Inclusivity.
    MRP must be present AND explicitly state 'inclusive of all taxes'.
    """
    rule_id = "rule_6_1_f"
    rule_desc = "MRP & Mandatory Tax Inclusivity Statement"
    citation = "Rule 6(1)(e) & Rule 6(1)(f), Legal Metrology (Packaged Commodities) Rules, 2011"

    mrp_data = data.get("mrp") or {}
    val = mrp_data.get("value")
    tax_inclusive = mrp_data.get("is_tax_inclusive", False)

    if val is None or val <= 0:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Maximum Retail Price (MRP) is missing or unpriced on the label.",
            "severity": "violation",
            "citation": citation
        }

    if not tax_inclusive:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": f"MRP is declared (₹{val:.2f}) but omits the mandatory statutory statement 'inclusive of all taxes' or '(incl. of all taxes)'.",
            "severity": "violation",
            "citation": citation
        }

    return {
        "rule_id": rule_id,
        "rule_description": rule_desc,
        "status": "pass",
        "reason": f"Maximum Retail Price verified: ₹{val:.2f} (inclusive of all taxes).",
        "severity": "violation",
        "citation": citation
    }

def check_rule_6_1_d_mfg_date(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rule 6(1)(d): Month and Year of manufacture or packing.
    Flags if only a 'best before' duration exists without an anchor manufacturing date.
    """
    rule_id = "rule_6_1_d"
    rule_desc = "Month & Year of Manufacture / Packing"
    citation = "Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011"

    mfg = data.get("mfg_date") or {}
    mfg_raw = mfg.get("raw_string") if isinstance(mfg, dict) else str(mfg or "")
    mfg_month = mfg.get("month") if isinstance(mfg, dict) else None
    mfg_year = mfg.get("year") if isinstance(mfg, dict) else None

    best_before = data.get("best_before") or {}
    only_duration = best_before.get("is_only_duration", False) if isinstance(best_before, dict) else False

    has_mfg_date = bool(mfg_raw or (mfg_month and mfg_year))

    if not has_mfg_date and only_duration:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Package declares a 'Best Before' duration only, without the mandatory explicit Month and Year of manufacture/packing.",
            "severity": "violation",
            "citation": citation
        }

    if not has_mfg_date:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Month and Year of manufacture or pre-packing is completely missing.",
            "severity": "violation",
            "citation": citation
        }

    return {
        "rule_id": rule_id,
        "rule_description": rule_desc,
        "status": "pass",
        "reason": f"Month and Year of packing/manufacture declared: '{mfg_raw or f'{mfg_month}/{mfg_year}'}'.",
        "severity": "violation",
        "citation": citation
    }

def check_rule_consumer_care_2022(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    2022 Amendment to Rule 6: Mandatory consumer care contact details.
    Must include BOTH email ID and telephone helpline.
    """
    rule_id = "rule_consumer_care_2022"
    rule_desc = "Consumer Care Contact Details (2022 Amendment)"
    citation = "Legal Metrology (Packaged Commodities) Amendment Rules, 2022"

    care = data.get("consumer_care") or data.get("consumer_care_contact") or {}
    email = (care.get("email") or "").strip()
    phone = (care.get("phone") or "").strip()

    if email and phone:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "pass",
            "reason": f"Complete consumer care verified: Email ({email}) & Helpline ({phone}).",
            "severity": "violation",
            "citation": citation
        }

    if email and not phone:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": f"Consumer care email found ({email}), but mandatory telephone helpline is missing under 2022 amendment.",
            "severity": "violation",
            "citation": citation
        }

    if not email and phone:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": f"Consumer helpline telephone found ({phone}), but mandatory consumer care email ID is missing under 2022 amendment.",
            "severity": "violation",
            "citation": citation
        }

    return {
        "rule_id": rule_id,
        "rule_description": rule_desc,
        "status": "fail",
        "reason": "Consumer grievance redressal details missing: 2022 amendment mandates BOTH email and telephone helpline.",
        "severity": "violation",
        "citation": citation
    }

def check_country_of_origin(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Country of Origin declaration.
    Mandatory for imported commodities (Rule 6(1)(c) Proviso, 2020 amendment).
    """
    rule_id = "rule_country_of_origin"
    rule_desc = "Country of Origin Declaration"
    citation = "Rule 6(1)(c) Proviso (2020 Amendment), Legal Metrology Rules"

    origin = (data.get("country_of_origin") or "").strip()
    is_imported = data.get("is_imported", False)

    if origin:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "pass",
            "reason": f"Country of origin explicitly declared: '{origin}'.",
            "severity": "violation" if is_imported else "advisory",
            "citation": citation
        }

    if is_imported:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "Imported commodity missing mandatory Country of Origin declaration.",
            "severity": "violation",
            "citation": citation
        }

    return {
        "rule_id": rule_id,
        "rule_description": rule_desc,
        "status": "fail",
        "reason": "Country of origin is not explicitly declared (advisory for domestic goods, mandatory for imports).",
        "severity": "advisory",
        "citation": citation
    }

def check_font_size_heuristic(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rule 7 & 9 Schedule: MRP font-size height heuristic.
    Estimates MRP numeral height relative to frame height.
    Labelled as an approximation, not certified laboratory measurement.
    """
    rule_id = "rule_font_size_heuristic"
    rule_desc = "Font Size & Readability Analysis (Rule 7 & 9)"
    citation = "Rule 7 & Rule 9 Schedule, Legal Metrology (Packaged Commodities) Rules, 2011"

    estimate = data.get("font_size_estimate") or {}
    ratio = estimate.get("mrp_height_ratio")
    min_threshold = estimate.get("threshold", 0.02)  # Default ~2% of photo height

    if ratio is None:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "pass",
            "reason": "Font size evaluation skipped (image dimensions or word bounding boxes not supplied).",
            "severity": "advisory",
            "citation": citation
        }

    if ratio >= min_threshold:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "pass",
            "reason": f"MRP numeral height ratio is {ratio * 100:.1f}% of frame (>= {min_threshold * 100:.1f}% threshold). Approximate visual check.",
            "severity": "advisory",
            "citation": citation
        }

    return {
        "rule_id": rule_id,
        "rule_description": rule_desc,
        "status": "fail",
        "reason": f"MRP numeral height ratio is estimated at {ratio * 100:.1f}% of frame (< {min_threshold * 100:.1f}% threshold). Undersized text may violate Rule 9 minimum height schedule. (Field approximation, not certified).",
        "severity": "advisory",
        "citation": citation
    }

def check_qr_code(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    QR Code Validation (Rule 6 Proviso).
    If detected, decode and check if it resolves to valid URL/expected declaration data.
    """
    rule_id = "rule_qr_code"
    rule_desc = "QR Code / 2D Matrix Declaration Validation"
    citation = "Rule 6 Proviso (Digital Declarations Provisions)"

    qr_info = data.get("qr_code_data") or {}
    detected = qr_info.get("detected", False)
    payload = (qr_info.get("raw_payload") or "").strip()
    status = qr_info.get("status", "none")

    if not detected:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "pass",
            "reason": "No QR code detected (optional on standard retail packages; mandatory for electronics/e-commerce digital declarations).",
            "severity": "advisory",
            "citation": citation
        }

    if status == "blank" or not payload:
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": "QR code detected on label but decoded payload is blank or empty.",
            "severity": "violation",
            "citation": citation
        }

    if status == "broken":
        return {
            "rule_id": rule_id,
            "rule_description": rule_desc,
            "status": "fail",
            "reason": f"QR code decoded ('{payload[:50]}...') but target URL or digital disclosure is broken or unreachable.",
            "severity": "violation",
            "citation": citation
        }

    return {
        "rule_id": rule_id,
        "rule_description": rule_desc,
        "status": "pass",
        "reason": f"QR code payload decoded and valid: '{payload[:60]}...'.",
        "severity": "advisory",
        "citation": citation
    }

def evaluate_rules(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates all statutory rules against the extracted label data.
    Returns master compliance verdict, count of violations, and list of checks.
    """
    checks = [
        check_rule_6_1_a_manufacturer(data),
        check_rule_6_1_b_net_quantity(data),
        check_rule_6_1_f_mrp_tax(data),
        check_rule_6_1_d_mfg_date(data),
        check_rule_consumer_care_2022(data),
        check_country_of_origin(data),
        check_font_size_heuristic(data),
        check_qr_code(data)
    ]

    hard_violations = [c for c in checks if c["status"] == "fail" and c["severity"] == "violation"]
    advisories = [c for c in checks if c["status"] == "fail" and c["severity"] == "advisory"]
    passed = [c for c in checks if c["status"] == "pass"]

    is_compliant = len(hard_violations) == 0

    return {
        "is_compliant": is_compliant,
        "hard_violations_count": len(hard_violations),
        "advisories_count": len(advisories),
        "passed_count": len(passed),
        "total_checks": len(checks),
        "checks": checks,
        "summary": "Product complies with all mandatory Legal Metrology packaging declarations." if is_compliant else f"{len(hard_violations)} mandatory statutory violation(s) detected on packaging label."
    }
