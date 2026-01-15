import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from lab.models import LabTest

LAB_TESTS = [
    # Haematology
    {"name": "AEC", "category": "HAEMATOLOGY", "price": 150},
    {"name": "BLOOD R/E (TC,DC,ESR,HB)", "category": "HAEMATOLOGY", "price": 150},
    {"name": "CBC", "category": "HAEMATOLOGY", "price": 200},
    {"name": "CBC + ESR", "category": "HAEMATOLOGY", "price": 200},
    {"name": "TC", "category": "HAEMATOLOGY", "price": 50},
    {"name": "DC", "category": "HAEMATOLOGY", "price": 50},
    {"name": "ESR", "category": "HAEMATOLOGY", "price": 50},
    {"name": "HB", "category": "HAEMATOLOGY", "price": 50},
    {"name": "PLATELET COUNT (MANUAL METHOD)", "category": "HAEMATOLOGY", "price": 150},
    {"name": "PLATELET COUNT (ANALYZER)", "category": "HAEMATOLOGY", "price": 100},
    {"name": "BT + CT", "category": "HAEMATOLOGY", "price": 50},
    {"name": "MP SMEAR", "category": "HAEMATOLOGY", "price": 200},
    {"name": "MP CARD", "category": "HAEMATOLOGY", "price": 150},
    {"name": "MF SMEAR", "category": "HAEMATOLOGY", "price": 300},
    {"name": "PCV", "category": "HAEMATOLOGY", "price": 100},
    {"name": "RETICULOCYTE COUNT", "category": "HAEMATOLOGY", "price": 150},
    {"name": "SICKLING TEST", "category": "HAEMATOLOGY", "price": 250},
    {"name": "PT/INR", "category": "HAEMATOLOGY", "price": 150},
    {"name": "APTT", "category": "HAEMATOLOGY", "price": 300},
    {"name": "GROUP & Rh", "category": "HAEMATOLOGY", "price": 50},
    {"name": "PERIPHERAL SMEAR (Pathologist)", "category": "HAEMATOLOGY", "price": 300},

    # Immuno Haematology
    {"name": "ICT", "category": "IMMUNO_HAEMATOLOGY", "price": 250},
    {"name": "DCT", "category": "IMMUNO_HAEMATOLOGY", "price": 250},
    {"name": "ASO (LATEX)", "category": "IMMUNO_HAEMATOLOGY", "price": 150},
    {"name": "ASO (TURBIDOMETRY)", "category": "IMMUNO_HAEMATOLOGY", "price": 250},
    {"name": "RA (LATEX)", "category": "IMMUNO_HAEMATOLOGY", "price": 150},
    {"name": "RA (TURBIDOMETRY)", "category": "IMMUNO_HAEMATOLOGY", "price": 250},
    {"name": "CRP (LATEX)", "category": "IMMUNO_HAEMATOLOGY", "price": 150},
    {"name": "CRP (TURBIDOMETRY)", "category": "IMMUNO_HAEMATOLOGY", "price": 250},
    {"name": "WIDAL (SLIDE METHOD)", "category": "IMMUNO_HAEMATOLOGY", "price": 150},
    {"name": "WIDAL (TUBE METHOD)", "category": "IMMUNO_HAEMATOLOGY", "price": 250},
    {"name": "TPHA", "category": "IMMUNO_HAEMATOLOGY", "price": 350},

    # Urine Test
    {"name": "URINE R/E", "category": "URINE", "price": 70},
    {"name": "URINE COMPLETE ANALYSIS", "category": "URINE", "price": 100},
    {"name": "URINE SUGAR", "category": "URINE", "price": 20},
    {"name": "BS BP", "category": "URINE", "price": 50},
    {"name": "URINE MICROSCOPY", "category": "URINE", "price": 50},
    {"name": "URINE KETONE BODIES", "category": "URINE", "price": 50},
    {"name": "URINE BENCE JONES PROTEIN", "category": "URINE", "price": 100},
    {"name": "URINE SPECIFIC GRAVITY", "category": "URINE", "price": 100},
    {"name": "URINE MICROALBUMIN", "category": "URINE", "price": 400},
    {"name": "URINE PREGNANCY TEST", "category": "URINE", "price": 100},
    {"name": "URINE ACR (ALBUMIN CREATININE RATIO)", "category": "URINE", "price": 400},
    {"name": "URINE PCR (PROTEIN CREATININE RATIO)", "category": "URINE", "price": 400},
    {"name": "URINE UROBILINOGEN", "category": "URINE", "price": 150},
    {"name": "URINE 24 HRS PROTEIN", "category": "URINE", "price": 300},

    # Stool Tests
    {"name": "STOOL R/E", "category": "STOOL", "price": 150},
    {"name": "STOOL REDUCING SUBSTANCE", "category": "STOOL", "price": 50},
    {"name": "STOOL OCCULT BLOOD", "category": "STOOL", "price": 100},
    {"name": "STOOL HANGING DROP", "category": "STOOL", "price": 100},

    # Microbiology
    {"name": "URINE C/S", "category": "MICROBIOLOGY", "price": 250},
    {"name": "SPUTUM C/S", "category": "MICROBIOLOGY", "price": 300},
    {"name": "STOOL C/S", "category": "MICROBIOLOGY", "price": 300},
    {"name": "PUS C/S", "category": "MICROBIOLOGY", "price": 300},
    {"name": "OTHER FLUIDS", "category": "MICROBIOLOGY", "price": 300},
    {"name": "BLOOD C/S", "category": "MICROBIOLOGY", "price": 500},

    # Serology
    {"name": "HBSAG CARD TEST", "category": "SEROLOGY", "price": 100},
    {"name": "HBSAG ECLIA", "category": "SEROLOGY", "price": 250},
    {"name": "HIV CARD TEST", "category": "SEROLOGY", "price": 200},
    {"name": "HIV ECLIA", "category": "SEROLOGY", "price": 500},
    {"name": "HCV CARD TEST", "category": "SEROLOGY", "price": 300},
    {"name": "HCV ECLIA", "category": "SEROLOGY", "price": 500},
    {"name": "VDRL RPR TEST", "category": "SEROLOGY", "price": 100},
    {"name": "VDRL CARD TEST", "category": "SEROLOGY", "price": 100},
    {"name": "CHICKEN GUNIYA CARD TEST", "category": "SEROLOGY", "price": 500},
    {"name": "LEPTOSPIRA CARD TEST", "category": "SEROLOGY", "price": 500},
    {"name": "DENGUE CARD TEST", "category": "SEROLOGY", "price": 500},
    {"name": "TROPONIN CARD", "category": "SEROLOGY", "price": 500},

    # Biochemistry
    {"name": "SUGAR", "category": "BIOCHEMISTRY", "price": 30},
    {"name": "GTT", "category": "BIOCHEMISTRY", "price": 350},
    {"name": "TRIGLYCERIDES", "category": "BIOCHEMISTRY", "price": 150},
    {"name": "GCT WITH GLUCOSE", "category": "BIOCHEMISTRY", "price": 100},
    {"name": "HDL", "category": "BIOCHEMISTRY", "price": 200},
    {"name": "LDL DIRECT", "category": "BIOCHEMISTRY", "price": 250},
    {"name": "CHOLESTEROL", "category": "BIOCHEMISTRY", "price": 80},
    {"name": "LIPID PROFILE", "category": "BIOCHEMISTRY", "price": 350},
    {"name": "UREA", "category": "BIOCHEMISTRY", "price": 100},
    {"name": "CREATININE", "category": "BIOCHEMISTRY", "price": 100},
    {"name": "URIC ACID", "category": "BIOCHEMISTRY", "price": 100},
    {"name": "CALCIUM", "category": "BIOCHEMISTRY", "price": 150},
    {"name": "PHOSPHORUS", "category": "BIOCHEMISTRY", "price": 150},
    {"name": "LDH", "category": "BIOCHEMISTRY", "price": 400},
    {"name": "CPK", "category": "BIOCHEMISTRY", "price": 400},
    {"name": "CKMB", "category": "BIOCHEMISTRY", "price": 500},
    {"name": "AMYLASE", "category": "BIOCHEMISTRY", "price": 400},
    {"name": "LIPASE", "category": "BIOCHEMISTRY", "price": 500},
    {"name": "SODIUM", "category": "BIOCHEMISTRY", "price": 150},
    {"name": "POTASSIUM", "category": "BIOCHEMISTRY", "price": 150},
    {"name": "CHLORIDE", "category": "BIOCHEMISTRY", "price": 150},
    {"name": "ELECTROLYTE", "category": "BIOCHEMISTRY", "price": 400},
    {"name": "BILIRUBIN T", "category": "BIOCHEMISTRY", "price": 100},
    {"name": "BILIRUBIN T & D", "category": "BIOCHEMISTRY", "price": 150},
    {"name": "SGOT", "category": "BIOCHEMISTRY", "price": 120},
    {"name": "SGPT", "category": "BIOCHEMISTRY", "price": 120},
    {"name": "ALK.PHOSPHATASE", "category": "BIOCHEMISTRY", "price": 120},
    {"name": "TOTAL PROTEIN", "category": "BIOCHEMISTRY", "price": 100},
    {"name": "ALBUMIN", "category": "BIOCHEMISTRY", "price": 100},
    {"name": "TOTAL PROTEIN & ALBUMIN", "category": "BIOCHEMISTRY", "price": 150},
    {"name": "LFT", "category": "BIOCHEMISTRY", "price": 450},
    {"name": "RFT", "category": "BIOCHEMISTRY", "price": 400},
    {"name": "GAMA GT", "category": "BIOCHEMISTRY", "price": 400},
    {"name": "HBA1C", "category": "BIOCHEMISTRY", "price": 400},

    # Hormone Assay
    {"name": "T3", "category": "HORMONE", "price": 200},
    {"name": "T4", "category": "HORMONE", "price": 200},
    {"name": "TSH", "category": "HORMONE", "price": 200},
    {"name": "TFT", "category": "HORMONE", "price": 400},
    {"name": "FT3", "category": "HORMONE", "price": 250},
    {"name": "FT4", "category": "HORMONE", "price": 250},
    {"name": "BETA HCG", "category": "HORMONE", "price": 500},
    {"name": "PROLACTIN", "category": "HORMONE", "price": 500},
    {"name": "FSH", "category": "HORMONE", "price": 500},
    {"name": "LH", "category": "HORMONE", "price": 500},
    {"name": "IGE", "category": "HORMONE", "price": 500},
    {"name": "VIT-D", "category": "HORMONE", "price": 1000},
    {"name": "PSA", "category": "HORMONE", "price": 500},
    {"name": "FERRITIN", "category": "HORMONE", "price": 450},
    {"name": "TROPONIN ECLIA", "category": "HORMONE", "price": 600},

    # Others / Semen / X-Ray (Mapping to OTHERS/XRAY/OTHERS)
    {"name": "SEMEN ANALYSIS", "category": "OTHERS", "price": 200}, # Or add category?
    {"name": "MX TEST", "category": "OTHERS", "price": 150},
    {"name": "ECG 6 chanel", "category": "OTHERS", "price": 150},
    {"name": "ECG 12 chanel", "category": "OTHERS", "price": 200},
    {"name": "DENTAL", "category": "XRAY", "price": 120},
    {"name": "DIGITAL ONE EXPOSURE", "category": "XRAY", "price": 250},
    {"name": "DIGITAL TWO EXPOSURE", "category": "XRAY", "price": 350},
]

def seed_tests():
    print("Seeding Lab Tests...")
    for data in LAB_TESTS:
        LabTest.objects.get_or_create(
            name=data["name"],
            defaults={"category": data["category"], "price": data["price"]}
        )
    print("Seeding Complete!")

if __name__ == "__main__":
    seed_tests()
