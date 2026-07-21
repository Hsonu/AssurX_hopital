import { DiagnosticService, HealthPackage, Testimonial } from './types';

export const DIAGNOSTIC_SERVICES: DiagnosticService[] = [
  // --- GENERAL ULTRASOUND (USG) ---
  {
    id: 'scan-usg-whole-abd-pelvis',
    name: 'Whole Abdomen/Pelvis + Abdomen',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 2500,
    discountPrice: 1300,
    description: 'Detailed USG examination of upper & lower abdominal organs, pelvic structures, kidneys, liver, gallbladder, and urinary tract.',
    preparation: 'Overnight or 6 hours fasting mandatory. Full bladder required.',
    duration: '15-20 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-usg-upper-abd-kub',
    name: 'Upper Abdomen/Pelvis/KUB',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 2000,
    discountPrice: 1000,
    description: 'Ultrasound screening of upper abdomen organs, liver, kidneys, ureters, and bladder (KUB).',
    preparation: 'Fasting 6 hours mandatory. Full bladder required for KUB evaluation.',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-usg-pelvis-ta-tvs',
    name: 'USG Pelvis (TA & TVS)',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 2000,
    discountPrice: 1000,
    description: 'Transabdominal and Transvaginal ultrasound for in-depth evaluation of uterus, ovaries, and pelvic anatomy.',
    preparation: 'Full bladder required for TA scan. Empty bladder for TVS scan.',
    duration: '15-20 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-usg-neck',
    name: 'USG Neck',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 2500,
    discountPrice: 1300,
    description: 'Ultrasound imaging of neck structures including thyroid gland, parotid, submandibular glands, and cervical lymph nodes.',
    preparation: 'No fasting required. Avoid wearing neck jewelry.',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-usg-scrotum',
    name: 'USG Scrotum',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 2500,
    discountPrice: 1300,
    description: 'High-frequency ultrasound evaluation of testes, epididymis, and scrotal tissues for varicoceles, hydroceles, or lesions.',
    preparation: 'No fasting required.',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-usg-breast-unilateral',
    name: 'USG Breast (Unilateral)',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 2800,
    discountPrice: 1500,
    description: 'Focused ultrasound scan of single breast tissue and axillary lymph nodes to evaluate lumps, cysts, or localized pain.',
    preparation: 'No talcum powder or lotion on skin on scan day.',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-usg-breast-bilateral',
    name: 'USG Breast (Bilateral)',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 3800,
    discountPrice: 2000,
    description: 'Complete high-resolution ultrasound screening of both breasts and axillae for cyst, fibroadenoma, or tissue assessment.',
    preparation: 'Do not apply powders or deodorants on chest area.',
    duration: '20 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-usg-small-part-unilateral',
    name: 'USG Small Part (Unilateral)/Local Part/Chest',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 2500,
    discountPrice: 1300,
    description: 'High-frequency superficial tissue or localized part ultrasound (chest wall, lipoma, swelling, or single site organ).',
    preparation: 'No special preparation needed.',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-usg-local-part-bilateral',
    name: 'USG Local Part (Bilateral)',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 3500,
    discountPrice: 2000,
    description: 'Bilateral superficial tissue scan covering paired local body regions or structures.',
    preparation: 'No special preparation needed.',
    duration: '20 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-usg-articular-msk',
    name: 'Articular joints/MSK joints',
    category: 'scan',
    subCategory: 'General Ultrasound',
    price: 2800,
    discountPrice: 1500,
    description: 'Musculoskeletal ultrasound scan evaluating joint cartilage, tendons, ligaments, synovium, and soft tissue fluid collections.',
    preparation: 'No fasting required.',
    duration: '15-20 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },

  // --- OBSTETRICS SCANS ---
  {
    id: 'scan-obs-1st-trimester',
    name: '1st Trimester',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 2200,
    discountPrice: 1200,
    description: 'Early pregnancy ultrasound to confirm intrauterine viability, gestational age, cardiac activity, and single/twin pregnancy.',
    preparation: 'Moderate full bladder required.',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-obs-2nd-trimester',
    name: '2nd Trimester',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 2200,
    discountPrice: 1200,
    description: 'Routine second trimester fetal growth evaluation, placenta location, and amniotic fluid check.',
    preparation: 'No fasting required.',
    duration: '15-20 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-obs-routine-trimester',
    name: 'Routine Trimester',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 2200,
    discountPrice: 1200,
    description: 'Regular antenatal growth and wellbeing scan monitoring fetal parameters, weight estimate, and liquor level.',
    preparation: 'No fasting required.',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-obs-3d-pregnancy',
    name: '3D Pregnancy',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 3600,
    discountPrice: 2000,
    description: 'Advanced 3D surface rendering volumetric ultrasound of fetus providing realistic facial and physical anatomical visualization.',
    preparation: 'No fasting required. Stay hydrated.',
    duration: '20-25 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-obs-nt-scan',
    name: 'NT Scan',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 3600,
    discountPrice: 2000,
    description: 'Specialized 11-13.6 week pregnancy scan measuring nuchal translucency and nasal bone for chromosomal abnormality screening.',
    preparation: 'Moderately full bladder.',
    duration: '20-30 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-obs-anomaly-scan',
    name: 'Anomaly Scan',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 4500,
    discountPrice: 2500,
    description: 'Comprehensive detailed level-II anatomical scan done at 18-22 weeks to evaluate organ structures, spine, heart, brain, and limbs.',
    preparation: 'No fasting. Eat light meal before scan.',
    duration: '30-40 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-obs-follicular-single',
    name: 'Follicular Study (Single)',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 1000,
    discountPrice: 500,
    description: 'Single TVS ultrasound visit to measure ovarian follicle growth, endometrial thickness, and ovulation tracking.',
    preparation: 'Empty bladder before procedure.',
    duration: '10 mins',
    reportDelivery: 'Immediate (within 30 mins)'
  },
  {
    id: 'scan-obs-follicular-package',
    name: 'Follicular Study (Package)',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 3600,
    discountPrice: 2000,
    description: 'Package covering multiple serial TVS ultrasound visits throughout menstrual cycle to track follicle maturation and ovulation day.',
    preparation: 'Empty bladder before each visit.',
    duration: 'Multiple sittings',
    reportDelivery: 'Cumulative Report',
    popular: true
  },
  {
    id: 'scan-obs-twins-pregnancy',
    name: 'Twins Scan (Pregnancy)',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 3600,
    discountPrice: 2000,
    description: 'Specialized antenatal ultrasound growth evaluation for twin (multiple) gestations.',
    preparation: 'No fasting required.',
    duration: '25 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-obs-twins-anomaly',
    name: 'Twins Scan (Anomaly)',
    category: 'scan',
    subCategory: 'Obstetrics Scans',
    price: 6000,
    discountPrice: 3500,
    description: 'Detailed level-II anomaly scan evaluating complete anatomical organ structures for twin fetuses.',
    preparation: 'No fasting required.',
    duration: '45 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },

  // --- DOPPLER SCANS ---
  {
    id: 'scan-doppler-scrotal',
    name: 'Scrotal Doppler',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 3600,
    discountPrice: 2000,
    description: 'Color Doppler ultrasound measuring blood vascular flow in testicular arteries/veins for varicocele, torsion, or ischemia.',
    preparation: 'No fasting required.',
    duration: '20 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-doppler-small-part',
    name: 'Small Part',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 3200,
    discountPrice: 1800,
    description: 'Vascular Doppler study for localized superficial mass, tissue inflammation, or thyroid/gland blood flow.',
    preparation: 'No special preparation.',
    duration: '15-20 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-doppler-renal',
    name: 'Renal Doppler',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 4500,
    discountPrice: 2500,
    description: 'Renal artery Color Doppler to diagnose renal artery stenosis, renovascular hypertension, or transplant kidney perfusion.',
    preparation: 'Strict 6-8 hours fasting required.',
    duration: '25 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-doppler-neck-carotid',
    name: 'Neck/Carotid Doppler',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 3600,
    discountPrice: 2000,
    description: 'Color Doppler assessment of carotid and vertebral arteries to screen stroke risk, plaque, and vessel stenosis.',
    preparation: 'No neck accessories or high collar clothing.',
    duration: '20 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-doppler-obstetric',
    name: 'Obstetric Doppler',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 3200,
    discountPrice: 1800,
    description: 'Umbilical, Uterine, and Middle Cerebral Artery (MCA) Doppler evaluating fetoplacental blood circulation and IUGR.',
    preparation: 'No fasting required.',
    duration: '20 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-doppler-artery-venous-unilateral',
    name: 'Artery/Venous Doppler (Unilateral)',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 3600,
    discountPrice: 2000,
    description: 'Color Doppler examination of arterial OR venous system of single upper or lower limb.',
    preparation: 'Wear loose clothing.',
    duration: '20-30 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-doppler-artery-venous-bilateral',
    name: 'Artery/Venous Doppler (Bilateral)',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 6000,
    discountPrice: 3500,
    description: 'Color Doppler study of arterial OR venous flow in both legs or arms.',
    preparation: 'Wear loose clothing.',
    duration: '35-45 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-doppler-art-ven-unilateral',
    name: 'Artery + Venous Doppler (Unilateral)',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 6500,
    discountPrice: 3800,
    description: 'Combined arterial AND venous vascular Doppler evaluation of single upper or lower limb.',
    preparation: 'Wear comfortable loose clothing.',
    duration: '30-40 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-doppler-art-ven-bilateral',
    name: 'Artery + Venous Doppler (Bilateral)',
    category: 'scan',
    subCategory: 'Doppler Scans',
    price: 12000,
    discountPrice: 7000,
    description: 'Full comprehensive combined arterial AND venous Color Doppler scan of both upper or lower limbs.',
    preparation: 'Wear loose clothing.',
    duration: '50-60 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },

  // --- ECHO (CARDIOLOGY) ---
  {
    id: 'scan-echo-2d',
    name: '2D-ECHO',
    category: 'scan',
    subCategory: 'Cardiology / ECHO',
    price: 4000,
    discountPrice: 2200,
    description: '2D Echocardiogram with Color Doppler evaluating heart chamber dimensions, valve function, wall motion, and Ejection Fraction.',
    preparation: 'No fasting needed. Wear loose clothing.',
    duration: '15-20 mins',
    reportDelivery: 'Immediate (within 30 mins)',
    popular: true
  },
  {
    id: 'scan-echo-foetal',
    name: 'Foetal ECHO',
    category: 'scan',
    subCategory: 'Cardiology / ECHO',
    price: 5500,
    discountPrice: 3000,
    description: 'Specialized ultrasound examination of fetal heart structures, cardiac chambers, valves, and congenital anomaly screening.',
    preparation: 'No fasting required.',
    duration: '30 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },

  // --- USG GUIDED PROCEDURES ---
  {
    id: 'scan-procedure-fnac',
    name: 'USG Guided FNAC',
    category: 'scan',
    subCategory: 'Interventional USG Procedures',
    price: 5500,
    discountPrice: 3000,
    description: 'Ultrasound-guided fine needle aspiration cytology procedure for precise diagnostic cell sampling of thyroid, breast, or neck lesions.',
    preparation: 'Prior doctor prescription & coagulation report (PT/INR) required.',
    duration: '20-30 mins',
    reportDelivery: '24-48 Hours'
  },
  {
    id: 'scan-procedure-biopsy',
    name: 'USG Guided Biopsy',
    category: 'scan',
    subCategory: 'Interventional USG Procedures',
    price: 10000,
    discountPrice: 6000,
    description: 'Real-time ultrasound-guided tissue core needle biopsy procedure performed by expert Radiologist.',
    preparation: 'Fasting 4 hours, doctor referral note, PT-INR & CBC reports mandatory.',
    duration: '30-45 mins',
    reportDelivery: '48-72 Hours'
  },
  // --- LAB / BLOOD TESTS ---
  {
    id: 'lab-cbc',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'lab',
    subCategory: 'General Blood Tests',
    price: 500,
    discountPrice: 290,
    description: 'Vital screening measuring RBC, WBC, Platelets, Hemoglobin, and ESR.',
    preparation: 'No fasting required.',
    duration: '10 mins',
    reportDelivery: 'Same Day (within 6 hours)',
    parametersCount: 24,
    popular: true
  },
  {
    id: 'lab-thyroid',
    name: 'Thyroid Profile (T3, T4, Ultra-TSH)',
    category: 'lab',
    subCategory: 'Hormone Assays',
    price: 800,
    discountPrice: 390,
    description: 'Measures key thyroid hormones to evaluate thyroid gland activity.',
    preparation: 'Fasting preferred.',
    duration: '10 mins',
    reportDelivery: 'Same Day',
    parametersCount: 3,
    popular: true
  },
  {
    id: 'lab-diabetes',
    name: 'Diabetes Screen (HbA1c & Fasting Blood Sugar)',
    category: 'lab',
    subCategory: 'Diabetic Profiles',
    price: 600,
    discountPrice: 299,
    description: 'Combines Blood Sugar Fasting with HbA1c to estimate average glucose.',
    preparation: '8-10 hours fasting required.',
    duration: '10 mins',
    reportDelivery: 'Same Day',
    parametersCount: 2,
    popular: true
  },
  {
    id: 'lab-lipid',
    name: 'Lipid Profile (Cholesterol & Triglycerides)',
    category: 'lab',
    subCategory: 'Cardiac Markers',
    price: 900,
    discountPrice: 450,
    description: 'Measures Total Cholesterol, HDL, LDL, VLDL, and Triglycerides.',
    preparation: '10-12 hours overnight fasting strictly required.',
    duration: '10 mins',
    reportDelivery: 'Same Day',
    parametersCount: 7
  },
  {
    id: 'lab-liver-lft',
    name: 'Liver Function Test (LFT)',
    category: 'lab',
    subCategory: 'Organ Screeners',
    price: 1100,
    discountPrice: 550,
    description: 'Analyzes Bilirubin, SGOT, SGPT, Alkaline Phosphatase, Albumin, Globulin.',
    preparation: 'Fasting of 8 hours recommended.',
    duration: '10 mins',
    reportDelivery: 'Same Day',
    parametersCount: 11
  },
  {
    id: 'lab-kidney-kft',
    name: 'Kidney Function Test (KFT / RFT)',
    category: 'lab',
    subCategory: 'Organ Screeners',
    price: 1000,
    discountPrice: 490,
    description: 'Measures Blood Urea, Serum Creatinine, Uric Acid, and Electrolytes.',
    preparation: 'Stay hydrated.',
    duration: '10 mins',
    reportDelivery: 'Same Day',
    parametersCount: 8
  },
  {
    id: 'lab-vitamin-d',
    name: 'Vitamin D (25-Hydroxy)',
    category: 'lab',
    subCategory: 'Vitamins & Minerals',
    price: 1500,
    discountPrice: 690,
    description: 'Measures Vitamin D concentration in blood.',
    preparation: 'Fasting not required.',
    duration: '10 mins',
    reportDelivery: 'Within 12 Hours',
    parametersCount: 1,
    popular: true
  },
  {
    id: 'lab-vitamin-b12',
    name: 'Vitamin B12 (Cobalamin)',
    category: 'lab',
    subCategory: 'Vitamins & Minerals',
    price: 1200,
    discountPrice: 590,
    description: 'Checks levels of Vitamin B12.',
    preparation: 'Fasting preferred.',
    duration: '10 mins',
    reportDelivery: 'Within 12 Hours',
    parametersCount: 1
  },
  {
    id: 'lab-urine-routine',
    name: 'Urine Routine & Microscopy (URM)',
    category: 'lab',
    subCategory: 'General Lab Tests',
    price: 400,
    discountPrice: 180,
    description: 'Evaluates physical, chemical, and microscopic properties of urine.',
    preparation: 'Clean morning urine sample.',
    duration: '5 mins',
    reportDelivery: 'Same Day',
    parametersCount: 18,
    popular: true
  }
];

export const HEALTH_PACKAGES: HealthPackage[] = [
  {
    id: 'pkg-sexual-health-basic',
    name: 'Sexual Health Package - Basic',
    price: 2500,
    discountPrice: 1250,
    description: 'Basic sexual health screening package covering major STI/STD markers and general blood count.',
    testsCount: 6,
    includedTests: [
      'HIV 1&2',
      'HbsAg',
      'Anti-HCV',
      'VDRL',
      'CBC',
      'Chlamydia IgG'
    ],
    idealFor: 'Adults seeking essential screening for common sexually transmitted infections.',
    frequency: 'As Needed / Annual',
    preparation: 'No specific fasting required.',
    popular: true
  },
  {
    id: 'pkg-sexual-health-pro',
    name: 'Sexual Health Package - Pro',
    price: 9500,
    discountPrice: 5500,
    description: 'Advanced comprehensive sexual health package testing for complete STI panel, antibodies, and immune cell status.',
    testsCount: 9,
    includedTests: [
      'HIV 1&2',
      'HBSAG',
      'ANTI-HCV',
      'VDRL',
      'Anti Chlamydia IgM',
      'Anti Chlamydia IgG',
      'HSV I & II (IgM+IgG)',
      'TPHA & TP Antibody',
      'CD3, CD4, CD8'
    ],
    idealFor: 'Adults needing a complete diagnostic panel for sexual health and viral/bacterial markers.',
    frequency: 'As Needed',
    preparation: 'No specific preparation required.',
    popular: false
  },
  {
    id: 'pkg-fever-profile',
    name: 'Fever Profile',
    price: 3000,
    discountPrice: 1700,
    description: 'Screening profile to diagnose underlying causes of acute or persistent fever including malaria, dengue, typhoid, and infection markers.',
    testsCount: 7,
    includedTests: [
      'CBC WITH ESR',
      'CRP',
      'WIDAL TEST',
      'MALARIA TEST',
      'URINE R/M/E',
      'DENGUE AG/AB',
      'DENGUE NS1'
    ],
    idealFor: 'Individuals experiencing acute fever, chills, body pain, or seasonal infection symptoms.',
    frequency: 'Immediate / On Symptoms',
    preparation: 'No fasting required.',
    popular: true
  },
  {
    id: 'pkg-sugar-profile',
    name: 'Sugar Profile',
    price: 2000,
    discountPrice: 1000,
    description: 'Comprehensive diabetic profile testing blood glucose, long-term glycemic control, insulin, kidney function, and lipids.',
    testsCount: 6,
    includedTests: [
      'FBS (Fasting Blood Sugar)',
      'PPBS (Post Prandial Blood Sugar)',
      'HbA1c',
      'Insulin',
      'Creatinine',
      'Triglycerides'
    ],
    idealFor: 'Diabetic & pre-diabetic patients, or those with family history of diabetes.',
    frequency: 'Every 3 to 6 Months',
    preparation: '8-10 hours fasting required for FBS, followed by sample 2 hours after meals for PPBS.',
    popular: true
  },
  {
    id: 'pkg-health-econo-plus',
    name: 'Comprehensive Health Package - ECONO +',
    price: 1200,
    discountPrice: 500,
    description: 'Economical entry-level health screening covering essential blood count, blood sugar, renal function, cholesterol, and urine parameters.',
    testsCount: 5,
    includedTests: [
      'Blood Sugar',
      'Serum Cholesterol',
      'Serum Creatinine',
      'Urine R/M/E',
      'Complete Blood Count'
    ],
    idealFor: 'Routine basic health checkup for all age groups.',
    frequency: 'Every 6 Months',
    preparation: '8-10 hours fasting required.',
    popular: true
  },
  {
    id: 'pkg-health-gold',
    name: 'Comprehensive Health Package - GOLD',
    price: 3500,
    discountPrice: 1500,
    description: 'Popular full-body checkup covering blood count, diabetes, liver, kidney, thyroid, lipid profile, and urine routine.',
    testsCount: 8,
    includedTests: [
      'Complete Blood Count',
      'Blood Sugar',
      'Lipid Profile',
      'Liver Function Test',
      'Thyroid Profile',
      'Kidney Function Test',
      'HbA1C with Graph',
      'Urine R/M/E'
    ],
    idealFor: 'Adults looking for thorough annual preventive health checkup.',
    frequency: 'Annually',
    preparation: '10-12 hours overnight fasting required.',
    popular: true
  },
  {
    id: 'pkg-health-platinum',
    name: 'Comprehensive Health Package - PLATINUM',
    price: 4800,
    discountPrice: 2250,
    description: 'Extended health screening adding key vitamins (Vitamin D & B12) and electrolytes to Gold package parameters.',
    testsCount: 11,
    includedTests: [
      'Complete Blood Count',
      'Blood Sugar',
      'Vitamin D',
      'Vitamin B12',
      'Lipid Profile',
      'Liver Function Test',
      'Thyroid Profile',
      'Electrolytes',
      'Kidney Function Test',
      'HbA1C with Graph',
      'Urine R/M/E'
    ],
    idealFor: 'Adults and working professionals needing deep metabolic and vitamin assessment.',
    frequency: 'Annually',
    preparation: '10-12 hours overnight fasting required.',
    popular: true
  },
  {
    id: 'pkg-health-platinum-plus',
    name: 'Health Package - PLATINUM +',
    price: 5200,
    discountPrice: 2500,
    description: 'All-inclusive full-body checkup adding complete Iron Profile along with vitamins, organ panels, and HbA1c.',
    testsCount: 12,
    includedTests: [
      'Complete Blood Count',
      'Blood Sugar (FBS+PPBS)',
      'Vitamin D',
      'Vitamin B12',
      'Lipid Profile',
      'Liver Function Test',
      'Thyroid Profile',
      'Electrolytes',
      'Kidney Function Test',
      'HbA1C with Graph',
      'Urine R/M/E',
      'IRON PROFILE'
    ],
    idealFor: 'Individuals wanting full body evaluation including anemia and iron storage markers.',
    frequency: 'Annually',
    preparation: '10-12 hours overnight fasting required.',
    popular: true
  },
  {
    id: 'pkg-health-ultimate',
    name: 'Health Package - ULTIMATE',
    price: 6500,
    discountPrice: 3200,
    description: 'Ultimate diagnostic suite including cardiac markers, joint markers (RA factor, ESR, CRP), iron profile, vitamins, and organ function tests.',
    testsCount: 15,
    includedTests: [
      'Complete Blood Count',
      'Blood Sugar',
      'Vitamin D',
      'Vitamin B12',
      'Lipid Profile',
      'Liver Function Test',
      'Thyroid Profile',
      'Electrolytes',
      'Kidney Function Test',
      'HbA1C',
      'Iron Profile',
      'RA Factor',
      'ESR',
      'CRP',
      'Cardiac Markers'
    ],
    idealFor: 'Comprehensive body scan for senior adults, executives, or individuals with chronic symptoms.',
    frequency: 'Annually',
    preparation: '10-12 hours overnight fasting required.',
    popular: true
  },
  {
    id: 'pkg-womens-health-essential',
    name: "Women's Health - ESSENTIAL",
    price: 5000,
    discountPrice: 2500,
    description: 'Essential hormonal and metabolic checkup tailored for women covering thyroid, female reproductive hormones, calcium, and blood count.',
    testsCount: 11,
    includedTests: [
      'Blood Sugar',
      'FSH',
      'Prolactin',
      'LH',
      'Estradiol E2',
      'Progesterone',
      'Serum Calcium',
      'HbA1c With Graph',
      'Free Thyroid Function Test (FT3,FT4,TSH)',
      'Complete Blood Count',
      'Serum Iron'
    ],
    idealFor: 'Women of all ages screening for hormonal balance, menstrual irregularities, or fatigue.',
    frequency: 'Annually',
    preparation: 'Overnight fasting required.',
    popular: true
  },
  {
    id: 'pkg-womens-health-advance',
    name: "Women's Health - ADVANCE",
    price: 8500,
    discountPrice: 4500,
    description: "Advanced women's health panel including detailed androgen profile (Testosterone, DHEAS), Beta HCG, Ferritin, SGPT/SGOT, and complete iron profile.",
    testsCount: 17,
    includedTests: [
      'Blood Sugar',
      'FSH',
      'Prolactin',
      'LH',
      'Estradiol E2',
      'Progesterone',
      'Serum Calcium',
      'HbA1c With Graph',
      'Free Thyroid Function Test (FT3,FT4,TSH)',
      'Complete Blood Count',
      'Iron Profile',
      'Total Testosterone',
      'Beta HCG',
      'DHEAS',
      'Ferritin',
      'SGPT, SGOT'
    ],
    idealFor: 'Women seeking full gynecological, hormonal, PCOD/PCOS, and metabolic health evaluation.',
    frequency: 'Annually',
    preparation: 'Overnight fasting required.',
    popular: false
  },
  {
    id: 'pkg-pain-management',
    name: 'Pain Management Package',
    price: 6800,
    discountPrice: 3450,
    description: 'Specialized diagnostic panel for investigating joint pain, arthritis, autoimmune markers (ANA, Anti-CCP, RA factor), bone minerals, and kidney function.',
    testsCount: 12,
    includedTests: [
      'VITAMIN D',
      'VITAMIN B12',
      'CALCITONIN',
      'CALCIUM',
      'RA FACTOR',
      'URIC ACID',
      'ANA',
      'ANTI-CCP',
      'CBC & ESR',
      'CRP',
      'KFT',
      'ELECTROLYTE'
    ],
    idealFor: 'Patients experiencing joint pain, arthritis, swelling, muscle soreness, or autoimmune symptoms.',
    frequency: 'As Advised by Physician',
    preparation: 'No specific fasting needed, morning sample preferred.',
    popular: false
  },
  {
    id: 'pkg-anemia-screening',
    name: 'Anemia Screening Package',
    price: 3500,
    discountPrice: 1700,
    description: 'Targeted screening package for diagnosing causes of anemia, low hemoglobin, ferritin levels, hemoglobinopathies, and liver function.',
    testsCount: 8,
    includedTests: [
      'FASTING BLOOD',
      'COMPLETE HEMOGRAM & ESR',
      'IRON PROFILE',
      'Hb-ELECTROFORESIS',
      'PERIPHERAL BLOOD',
      'FERRITIN',
      'LIVER FUNCTION TEST',
      'AMYLASE-LIPASE'
    ],
    idealFor: 'Patients with persistent fatigue, pale skin, weakness, or unexplained low hemoglobin.',
    frequency: 'As Needed',
    preparation: 'Fasting blood sample required.',
    popular: false
  },
  {
    id: 'pkg-pre-operative',
    name: 'Pre-Operative Package',
    price: 5000,
    discountPrice: 2700,
    description: 'Essential diagnostic pre-surgical clearance profile testing blood coagulation, viral markers, blood grouping, organ function, and ECG.',
    testsCount: 11,
    includedTests: [
      'CBC+ESR',
      'FBS , PPBS',
      'PT - INR',
      'HIV 1 & 2, ECG',
      'HBsAg',
      'ANTI - HCV',
      'RFT',
      'ABO GROUP',
      'BT-CT',
      'ELECTROLYTES',
      'LIVER FUNCTION TEST'
    ],
    idealFor: 'Patients scheduled for surgery or medical procedures requiring pre-op clearance.',
    frequency: 'Before Surgery',
    preparation: 'Overnight fasting required.',
    popular: false
  },
  {
    id: 'pkg-cardiac-profile',
    name: 'Cardiac Profile',
    price: 5800,
    discountPrice: 3000,
    description: 'Comprehensive cardiac screening assessing heart muscle markers (Trop I, CPK, CK-MB), blood sugar, ECG, D-Dimer, and liver/cardiac enzymes.',
    testsCount: 7,
    includedTests: [
      'FBS , PPBS',
      'CBC, ECG',
      'CPK',
      'CK - MB',
      'TROP I',
      'D-DIMER',
      'SGOT , LDH'
    ],
    idealFor: 'Individuals experiencing chest discomfort, breathlessness, hypertension, or heart risk monitoring.',
    frequency: 'As Needed / Annually',
    preparation: 'Fasting sample required.',
    popular: true
  },
  {
    id: 'pkg-infertility-profile',
    name: 'Infertility Profile (Male & Female)',
    price: 9800,
    discountPrice: 4950,
    description: 'Complete reproductive and fertility evaluation panel for couples, covering male and female hormonal panels and semen analysis.',
    testsCount: 17,
    includedTests: [
      'Female Panel: FBS, CBC, FSH, LH, Estradiol, Progesterone, Prolactin, SGPT, Thyroid Profile, Urine R/M/E',
      'Male Panel: FBS, CBC, FSH, LH, Prolactin, Testosterone (Free & Total), Semen Analysis'
    ],
    idealFor: 'Couples planning pregnancy or evaluating fertility health.',
    frequency: 'As Needed',
    preparation: 'Specific cycle day timing for females and 3-5 days abstinence for semen analysis.',
    popular: false
  },
  {
    id: 'pkg-hair-loss-profile',
    name: 'Hair Loss Profile',
    price: 8900,
    discountPrice: 4750,
    description: 'Specialized diagnostic panel for identifying root causes of alopecia and excessive hair fall, evaluating hormones, thyroid, biotin, and androgen status.',
    testsCount: 10,
    includedTests: [
      'FSH',
      'PROLACTIN',
      'LH',
      'FASTING INSULIN',
      'ESTRADIOL',
      'TESTOSTERONE (FREE AND TOTAL)',
      'SEX HORMONE BINDING GLOBULIN (SHBG)',
      'BIOTIN',
      'THYROID PROFILE',
      'DHEAS'
    ],
    idealFor: 'Men and women experiencing severe hair thinning, hair loss, or scalp issues.',
    frequency: 'As Needed',
    preparation: 'Fasting blood sample required.',
    popular: false
  }
];

export const FREQUENT_QUESTIONS = [
  {
    q: "Why are your rates significantly lower than other diagnostic centers?",
    a: "At AssurX, our mission is to make high-quality, trusted diagnostics affordable for every Indian. By utilizing high-throughput, state-of-the-art robotic machines in our centralized NABL labs and reducing administrative overheads, we pass 100% of the cost savings directly to our patients. We offer the exact same diagnostic accuracy and technology at up to 50% lower prices."
  },
  {
    q: "How does the Home Sample Collection service work?",
    a: "Once you book a blood test or health package and choose 'Home Collection', a certified, experienced medical Phlebotomist is assigned to your booking. They will visit your home at your chosen time slot, extract samples using sterile vacuum tubes, store them immediately in cold-chain transport boxes, and safely deliver them to our laboratory. Home collection is free or has a very nominal charge depending on your booking."
  },
  {
    q: "How and when will I get my diagnostic reports?",
    a: "Our diagnostic lab systems are highly automated. As soon as your report is ready, certified, and digitally signed by our doctors, you will receive an SMS and WhatsApp notification with a link. You can also view and download all historical reports instantly by logging into your Patient Portal/Dashboard on this website using your registered mobile number."
  },
  {
    q: "Are AssurX Scans and Lab reports valid in all hospitals?",
    a: "Absolutely! All AssurX laboratory reports are generated from NABL-accredited, state-of-the-art facilities and comply strictly with ISO standards. All scan images (MRI, CT, Ultrasound) are read and reported by highly experienced MD Radiologists. Our reports are 100% trusted and accepted by all major hospitals, clinicians, and health insurance providers across India."
  },
  {
    q: "What is the preparation required for an MRI or CT Scan?",
    a: "For general MRI, ensure no metal accessories are worn. For CT Whole Abdomen/Contrast scans or Whole Abdomen Ultrasounds, fasting for 6 hours is mandatory. For contrast CT scans, a recent Serum Creatinine lab report is required to verify kidney safety. Specific instructions for your booked test are shown clearly on your digital booking confirmation."
  }
];

export const CUSTOMER_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: "Rajesh Kumar",
    rating: 5,
    comment: "Excellent experience. Booked an USG scan for my father. Staff was very polite and supportive. MD Radiologist report was ready within 2 hours. Best diagnostic center in Malad with affordable rates!",
    location: "Malad West, Mumbai",
    date: "12 days ago"
  },
  {
    id: 't-2',
    name: "Sneha Deshmukh",
    rating: 5,
    comment: "The Phlebotomist arrived right on time for the Home Blood Collection. He was highly skilled, used sterile sealed equipment, and took the sample painless. Got accurate digital reports on WhatsApp the same evening!",
    location: "Goregaon East, Mumbai",
    date: "1 week ago"
  },
  {
    id: 't-3',
    name: "Amit Patel",
    rating: 5,
    comment: "Very neat, clean, and modern diagnostic center with high-tech equipment. Extremely polite staff and seamless online booking. Highly recommended for all ultrasound scans and blood checkups!",
    location: "Malad East, Mumbai",
    date: "3 days ago"
  }
];

export const ASSURX_CENTERS = [
  { city: "Malad", address: "Shop 1-3, SV Road, Opp. Malad Railway Station, Malad West, Mumbai - 400064", phone: "022-50117701" },
  { city: "Goregaon", address: "G-4, Sun Plaza, SV Road, Near Goregaon East Metro, Goregaon, Mumbai - 400063", phone: "022-50117702" }
];
