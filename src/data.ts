import { DiagnosticService, HealthPackage, Testimonial } from './types';

export const DIAGNOSTIC_SERVICES: DiagnosticService[] = [
  // --- SCAN SERVICES ---
  {
    id: 'scan-mri-brain',
    name: 'MRI Brain (1.5T / 3T)',
    category: 'scan',
    subCategory: 'MRI Scans',
    price: 6500,
    discountPrice: 3500,
    description: 'High-resolution imaging of the brain tissue. Highly effective for detecting stroke, tumors, aneurysms, and chronic headaches.',
    preparation: 'No metallic items allowed inside the scan room. Inform technician if you have implants, pacemakers, or claustrophobia.',
    duration: '25-35 mins',
    reportDelivery: 'Same Day (within 6 hours)',
    popular: true
  },
  {
    id: 'scan-mri-spine',
    name: 'MRI Lumbar / Cervical Spine',
    category: 'scan',
    subCategory: 'MRI Scans',
    price: 6000,
    discountPrice: 3200,
    description: 'Detailed view of the spinal cord, vertebrae, discs, and nerves. Best for evaluating back pain, slipped disc, and sciatica.',
    preparation: 'Remove all jewelry and metallic items. Standard clothing provided.',
    duration: '20-30 mins',
    reportDelivery: 'Same Day',
    popular: false
  },
  {
    id: 'scan-ct-brain',
    name: 'CT Brain (Non-Contrast)',
    category: 'scan',
    subCategory: 'CT Scans',
    price: 3000,
    discountPrice: 1600,
    description: 'Rapid, detailed imaging of brain structure. Used in emergencies for evaluating trauma, acute stroke, and brain bleeds.',
    preparation: 'No specific preparation. If contrast is prescribed, fasting of 4-6 hours is required along with a recent Serum Creatinine report.',
    duration: '5-10 mins',
    reportDelivery: 'Within 2 Hours',
    popular: true
  },
  {
    id: 'scan-ct-abdomen',
    name: 'CT Whole Abdomen & Pelvis (Contrast)',
    category: 'scan',
    subCategory: 'CT Scans',
    price: 8500,
    discountPrice: 4800,
    description: 'Detailed scan of abdominal organs like liver, kidneys, pancreas, spleen, bowel, and pelvic organs.',
    preparation: 'Fasting of 4-6 hours required. Bring a recent Serum Creatinine report. You may need to drink oral contrast fluid at the center.',
    duration: '15-25 mins',
    reportDelivery: 'Same Day',
    popular: false
  },
  {
    id: 'scan-usg-abdomen',
    name: 'Ultrasound (USG) Whole Abdomen & Pelvis',
    category: 'scan',
    subCategory: 'Ultrasound Scans',
    price: 2500,
    discountPrice: 1200,
    description: 'Safe, radiation-free ultrasound imaging of internal abdominal organs and the pelvic tract.',
    preparation: 'Overnight or 6 hours fasting is mandatory. Full bladder required (drink 1 litre of water 1 hour before the scan and do not urinate).',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)',
    popular: true
  },
  {
    id: 'scan-usg-obstetrics',
    name: 'Ultrasound Pregnancy / Obstetric Scan',
    category: 'scan',
    subCategory: 'Ultrasound Scans',
    price: 2200,
    discountPrice: 1100,
    description: 'Routine screening scan to monitor fetal development, amniotic fluid, and overall growth of the baby.',
    preparation: 'No fasting. Drink 2-3 glasses of water 45 minutes before the scan to keep the bladder moderately full.',
    duration: '15-20 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },
  {
    id: 'scan-xray-chest',
    name: 'Digital X-Ray Chest PA View',
    category: 'scan',
    subCategory: 'Digital X-Rays',
    price: 600,
    discountPrice: 350,
    description: 'Standard chest X-ray to diagnose lung infections (pneumonia, bronchitis), heart size, and fractures.',
    preparation: 'Remove any metallic items, necklaces, or innerwear with metal hooks before the scan. Protective lead apron is provided if needed.',
    duration: '5 mins',
    reportDelivery: 'Immediate (within 30 mins)',
    popular: true
  },
  {
    id: 'scan-mammogram',
    name: 'Digital Mammography (Bilateral)',
    category: 'scan',
    subCategory: 'Women Scans',
    price: 3500,
    discountPrice: 1800,
    description: 'Low-dose screening X-ray of breast tissues. Highly recommended annually for women over 40 for early breast cancer screening.',
    preparation: 'Do not apply deodorants, talcum powder, perfumes, or lotions under the arms or on breasts on the day of the test.',
    duration: '15 mins',
    reportDelivery: 'Same Day'
  },
  {
    id: 'scan-ecg',
    name: '12-Lead ECG (Electrocardiogram)',
    category: 'scan',
    subCategory: 'Cardiology Tests',
    price: 500,
    discountPrice: 250,
    description: 'Records the electrical activity of your heart to diagnose chest pain, palpitations, arrhythmia, or silent heart attacks.',
    preparation: 'Wear comfortable, loose clothing. Avoid oily skin lotions on the chest area.',
    duration: '5 mins',
    reportDelivery: 'Immediate (within 15 mins)',
    popular: true
  },
  {
    id: 'scan-echo',
    name: '2D Echocardiography (2D ECHO) with Color Doppler',
    category: 'scan',
    subCategory: 'Cardiology Tests',
    price: 3000,
    discountPrice: 1500,
    description: 'Ultrasound scan of the heart to evaluate heart chambers, valves, pumping capacity (Ejection Fraction), and blood flow patterns.',
    preparation: 'No fasting or specific preparation needed. Wear button-down shirt/clothing.',
    duration: '15-20 mins',
    reportDelivery: 'Immediate (within 30 mins)',
    popular: true
  },
  {
    id: 'scan-dexa',
    name: 'DEXA Bone Densitometry (Spine & Hip)',
    category: 'scan',
    subCategory: 'Bone Density',
    price: 3500,
    discountPrice: 1600,
    description: 'Highly accurate dual-energy X-ray absorption scan to measure Bone Mineral Density (BMD) for diagnosing osteoporosis and fracture risks.',
    preparation: 'Do not take calcium supplements for 24 hours prior to the scan. Wear metal-free clothing.',
    duration: '15 mins',
    reportDelivery: 'Immediate (within 1 hour)'
  },

  // --- LAB / BLOOD TESTS ---
  {
    id: 'lab-cbc',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'lab',
    subCategory: 'General Blood Tests',
    price: 500,
    discountPrice: 290,
    description: 'A vital screening test measuring Red Blood Cells, White Blood Cells, Platelets, Hemoglobin, and ESR. Detects anemia, infection, and leukemia.',
    preparation: 'No fasting required. Can be done anytime.',
    duration: '10 mins (sample collection)',
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
    description: 'Measures key thyroid hormones to evaluate thyroid gland activity. Essential for screening hypo- or hyperthyroidism, weight fluctuations, and fatigue.',
    preparation: 'Early morning sample is highly recommended. Fasting is preferred but not mandatory.',
    duration: '10 mins (sample collection)',
    reportDelivery: 'Same Day (within 6 hours)',
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
    description: 'Combines Blood Sugar Fasting with HbA1c to estimate your average blood glucose levels over the last 3 months. Essential for diabetic monitoring.',
    preparation: '8-10 hours strict overnight fasting is mandatory. Water is allowed.',
    duration: '10 mins (sample collection)',
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
    description: 'Measures Total Cholesterol, HDL (good), LDL (bad), VLDL, and Triglycerides to evaluate cardiovascular disease risk.',
    preparation: '10-12 hours overnight fasting is strictly required before sample collection.',
    duration: '10 mins (sample collection)',
    reportDelivery: 'Same Day',
    parametersCount: 7,
    popular: false
  },
  {
    id: 'lab-liver-lft',
    name: 'Liver Function Test (LFT)',
    category: 'lab',
    subCategory: 'Organ Screeners',
    price: 1100,
    discountPrice: 550,
    description: 'Analyzes blood levels of Bilirubin, SGOT, SGPT, Alkaline Phosphatase, Albumin, and Globulin to screen for liver damage or infections (hepatitis).',
    preparation: 'Fasting of 8 hours is recommended.',
    duration: '10 mins',
    reportDelivery: 'Same Day',
    parametersCount: 11,
    popular: false
  },
  {
    id: 'lab-kidney-kft',
    name: 'Kidney Function Test (KFT / RFT)',
    category: 'lab',
    subCategory: 'Organ Screeners',
    price: 1000,
    discountPrice: 490,
    description: 'Measures Blood Urea, Serum Creatinine, Uric Acid, and Electrolytes (Sodium, Potassium, Chloride) to evaluate renal filtering performance.',
    preparation: 'No specific fasting needed, but staying hydrated is advised.',
    duration: '10 mins',
    reportDelivery: 'Same Day',
    parametersCount: 8,
    popular: false
  },
  {
    id: 'lab-vitamin-d',
    name: 'Vitamin D (25-Hydroxy)',
    category: 'lab',
    subCategory: 'Vitamins & Minerals',
    price: 1500,
    discountPrice: 690,
    description: 'Measures Vitamin D concentration in blood. Crucial for bone strength, joint health, immune support, and calcium absorption.',
    preparation: 'Fasting not required. Inform doctor about any Vitamin D supplements taken recently.',
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
    description: 'Checks levels of Vitamin B12, essential for nerve cell health, red blood cell production, and cognitive performance.',
    preparation: '8 hours fasting is preferred but not mandatory.',
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
    description: 'Evaluates physical, chemical, and microscopic properties of urine to screen for UTIs, kidney disease, or diabetes.',
    preparation: 'Mid-stream clean-catch morning urine sample is ideal. Clean cup is provided.',
    duration: '5 mins (sample collection)',
    reportDelivery: 'Same Day (within 4 hours)',
    parametersCount: 18,
    popular: true
  }
];

export const HEALTH_PACKAGES: HealthPackage[] = [
  {
    id: 'pkg-assurx-essential',
    name: 'AssurX Essential Full Body Checkup',
    price: 3500,
    discountPrice: 1299,
    description: 'Comprehensive baseline evaluation covering 62 parameters to screen overall health, major organ systems, metabolism, and lipid levels.',
    testsCount: 62,
    includedTests: [
      'Complete Blood Count (CBC) with ESR (24 tests)',
      'Thyroid Profile (T3, T4, TSH) (3 tests)',
      'Diabetes: Blood Sugar Fasting & HbA1c (2 tests)',
      'Kidney Function Test (KFT/RFT) (8 tests)',
      'Liver Function Test (LFT) (11 tests)',
      'Lipid Profile (Cardiac Screen) (7 tests)',
      'Urine Routine & Analysis (18 tests)'
    ],
    idealFor: 'Ages 18-80. Highly recommended once in 6 months for everyone.',
    frequency: 'Every 6 Months',
    preparation: '10-12 hours strict overnight fasting is mandatory. Water is allowed.',
    popular: true
  },
  {
    id: 'pkg-assurx-premium',
    name: 'AssurX Premium Active Gold Care',
    price: 5500,
    discountPrice: 1999,
    description: 'Our bestseller package providing deep diagnostic coverage of 84 parameters, adding critical vitamins, calcium, and bone markers to our essential package.',
    testsCount: 84,
    includedTests: [
      'All 62 tests of the Essential Full Body Checkup',
      'Vitamin D (25-Hydroxy) (1 test)',
      'Vitamin B12 (Cobalamin) (1 test)',
      'Serum Calcium & Joint Screen (3 tests)',
      'Iron Deficiency Studies (4 tests)',
      'Uric Acid (Gout screener) (1 test)',
      'Complete Urine Routine & Sediments (18 tests)'
    ],
    idealFor: 'Working professionals, stressed lifestyles, bone & muscle pains, ages 25-65.',
    frequency: 'Annually',
    preparation: '10-12 hours strict overnight fasting is mandatory. Morning sample required.',
    popular: true
  },
  {
    id: 'pkg-assurx-women',
    name: 'AssurX Women Wellness Care',
    price: 4800,
    discountPrice: 1799,
    description: 'Specialized diagnostic package tailored entirely around women’s hormones, blood building (anemia), bone density, thyroid, and vitamin health.',
    testsCount: 75,
    includedTests: [
      'Complete Blood Count & Hemoglobin Index (24 tests)',
      'Thyroid Hormone Panel (Ultra-Sensitive) (3 tests)',
      'Vitamin D & Vitamin B12 levels (2 tests)',
      'Iron Studies with Ferritin (Anemia Screen) (4 tests)',
      'Lipid & Cholesterol Profile (7 tests)',
      'Kidney & Liver Organ Panels (19 tests)',
      'Serum Calcium & Bone Health Indicators (2 tests)',
      'Urine Culture Routine (18 tests)'
    ],
    idealFor: 'Women of all ages, especially for addressing tiredness, hair fall, hormonal or bone health issues.',
    frequency: 'Once a year',
    preparation: '10-12 hours overnight fasting required.',
    popular: false
  },
  {
    id: 'pkg-assurx-cardiac',
    name: 'AssurX Advanced Cardiac Risk Package',
    price: 6000,
    discountPrice: 2499,
    description: 'Custom preventative screening covering lab biomarkers, lipid fractions, and cardiac stress tests to identify early cardiovascular blockages or risks.',
    testsCount: 22,
    includedTests: [
      '12-Lead Electrocardiogram (ECG) at Center',
      '2D Echocardiography (ECHO) with Color Doppler at Center',
      'Lipid Profile (Total Cholesterol, HDL, LDL, VLDL, Triglycerides) (7 tests)',
      'HbA1c & Fasting Glucose (2 tests)',
      'C-Reactive Protein (CRP) Cardiac marker (1 test)',
      'Serum Creatinine & Kidney Screen (2 tests)',
      'Apolipoprotein A1 & B ratio (Cardiac hazard score) (2 tests)'
    ],
    idealFor: 'High blood pressure, family history of cardiac illness, sedentary workers, smokers, ages 30+.',
    frequency: 'Every 1-2 years',
    preparation: '12 hours fasting required. Rest fully before taking the ECG and ECHO tests.',
    popular: false
  },
  {
    id: 'pkg-assurx-senior',
    name: 'AssurX Senior Citizen Health Package',
    price: 5200,
    discountPrice: 1699,
    description: 'Specially optimized to evaluate chronic health issues, diabetes levels, bone degradation, prostate health (PSA for males), and kidney metrics for seniors.',
    testsCount: 68,
    includedTests: [
      'CBC with ESR & Blood Smear (24 tests)',
      'Kidney Panel (RFT) with electrolytes (8 tests)',
      'Liver Panel (LFT) with enzymes (11 tests)',
      'Thyroid Hormone Panel (TSH) (1 test)',
      'Lipid Cardiovascular Screen (7 tests)',
      'HBA1C Diabetes Control 3-month average (1 test)',
      'Joint Screen: Calcium & Phosphorus (2 tests)',
      'Uric Acid (Gout/Joint Pain marker) (1 test)',
      'Optional PSA (Prostate Specific Antigen) for males or Rheumatoid Factor (RA) for females'
    ],
    idealFor: 'Seniors aged 60 and above.',
    frequency: 'Every 6 Months',
    preparation: '10-12 hours strict fasting is mandatory. Staying hydrated with water is recommended.',
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
    comment: "Excellent experience. Booked an MRI Brain for my father. While other scanning centers quoted ₹8,000, AssurX completed it at ₹3,500. MD Radiologist report was ready within 4 hours. Absolute value for money!",
    location: "Malad West, Mumbai",
    date: "12 days ago"
  },
  {
    id: 't-2',
    name: "Sneha Deshmukh",
    rating: 5,
    comment: "The Phlebotomist arrived exactly at 7:30 AM for the Full Body Package collection. He was highly skilled, took the sample in a single painless prick, and showed me the sterile sealed needle. Received reports on WhatsApp by 5:00 PM.",
    location: "Goregaon East, Mumbai",
    date: "1 week ago"
  },
  {
    id: 't-3',
    name: "Amit Patel",
    rating: 4.8,
    comment: "Very neat, spacious scanning center with highly advanced machines. The staff assisted us with care. Booked and paid online, which was extremely convenient. Will highly recommend AssurX for any scans.",
    location: "Malad East, Mumbai",
    date: "3 days ago"
  }
];

export const ASSURX_CENTERS = [
  { city: "Malad", address: "Shop 1-3, SV Road, Opp. Malad Railway Station, Malad West, Mumbai - 400064", phone: "022-50117701" },
  { city: "Goregaon", address: "G-4, Sun Plaza, SV Road, Near Goregaon East Metro, Goregaon, Mumbai - 400063", phone: "022-50117702" }
];
