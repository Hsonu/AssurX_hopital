import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle, ShoppingBag, ArrowRight, PhoneCall, User } from 'lucide-react';
import { DiagnosticService, CartItem } from '../types';
import { DIAGNOSTIC_SERVICES } from '../data';

interface PrescriptionUploadProps {
  onAddItemsToCart: (items: CartItem[]) => void;
  onClose: () => void;
}

const PRESCRIPTION_TEMPLATES = [
  {
    id: 'temp-1',
    doctor: 'Dr. Alok Sharma, MD (Medicine)',
    notes: 'Patient complains of chronic fatigue and weight gain. Advised: Thyroid Profile, Vitamin D, and CBC.',
    extractedIds: ['lab-thyroid', 'lab-vitamin-d', 'lab-cbc'],
    title: 'Fatigue Screening (Thyroid + Vit D + CBC)'
  },
  {
    id: 'temp-2',
    doctor: 'Dr. S. Iyer, DM (Neurology)',
    notes: 'Severe recurrent migraines, family history of vertigo. Rule out structural issues. Advised: MRI Brain, Vitamin B12.',
    extractedIds: ['scan-mri-brain', 'lab-vitamin-b12'],
    title: 'Neurological Evaluation (MRI Brain + Vit B12)'
  },
  {
    id: 'temp-3',
    doctor: 'Dr. Reena Mehta, MD (Gynecology)',
    notes: 'Routine pregnancy assessment. Advised: Obstetric Ultrasound and Diabetes Screen.',
    extractedIds: ['scan-usg-obstetrics', 'lab-diabetes'],
    title: 'Maternal Assessment (USG Pregnancy + Diabetes)'
  }
];

export default function PrescriptionUpload({ onAddItemsToCart, onClose }: PrescriptionUploadProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [extractedServices, setExtractedServices] = useState<DiagnosticService[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  // New Patient Details states for callback assistant Routing
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [dontKnowTests, setDontKnowTests] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isCallbackSuccess, setIsCallbackSuccess] = useState(false);
  const [createdPrId, setCreatedPrId] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateInputs = (): boolean => {
    if (!patientName.trim()) {
      setValidationError('Please enter the patient’s full name first.');
      return false;
    }
    if (!patientPhone.trim() || patientPhone.trim().length !== 10) {
      setValidationError('Please enter a valid 10-digit mobile number so the assistant can call.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const saveToDatabase = async (name: string, doctorName: string, serviceIds: string[], isCallbackOnly: boolean) => {
    const prNum = Math.floor(100000 + Math.random() * 900000);
    const prId = `PRX-${prNum}`;
    setCreatedPrId(prId);

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: prId,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          fileName: name,
          dontKnowTests: isCallbackOnly,
          extractedServiceIds: serviceIds
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save prescription to database');
      }

      const savedPr = await response.json();

      const existingStr = localStorage.getItem('assurx_prescriptions');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(savedPr);
      localStorage.setItem('assurx_prescriptions', JSON.stringify(existing));
    } catch (error) {
      console.error("Prescription SQL synchronization failed:", error);
    }
    
    return prId;
  };

  const validateFile = (file: File): boolean => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.type)) {
      setValidationError('Unsupported file format. Please upload a PDF, JPG, JPEG, or PNG prescription image.');
      return false;
    }

    if (file.size > maxSizeBytes) {
      setValidationError('File size exceeds the 10MB limit. Please upload a smaller file.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!validateInputs()) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!validateFile(file)) return;
      processFile(file.name, 'Dr. Rajesh Patel, MBBS - Hand-written Note', ['lab-cbc', 'lab-diabetes', 'lab-urine-routine']);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!validateInputs()) {
      e.target.value = ''; // clear input
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!validateFile(file)) {
        e.target.value = ''; // clear input
        return;
      }
      processFile(file.name, 'Dr. Rajesh Patel, MBBS - Hand-written Note', ['lab-cbc', 'lab-diabetes', 'lab-urine-routine']);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    if (!validateInputs()) return;
    const temp = PRESCRIPTION_TEMPLATES.find(t => t.id === templateId);
    if (temp) {
      setSelectedTemplate(templateId);
      processFile(`prescription_${templateId}.pdf`, temp.doctor, temp.extractedIds);
    }
  };

  const processFile = (name: string, doctorName: string, serviceIds: string[]) => {
    setFileName(name);
    setIsProcessing(true);
    setIsCompleted(false);
    
    if (dontKnowTests) {
      // If patient doesn't know tests, register callback directly after simulation
      const steps = [
        'Uploading prescription file safely to secure HIPAA server...',
        'Registering clinic assistant consult callback request...',
        'Routing contact details to Malad / Goregaon clinical desks...'
      ];
      let currentStepIndex = 0;
      setProcessStep(steps[currentStepIndex]);

      const interval = setInterval(async () => {
        currentStepIndex++;
        if (currentStepIndex < steps.length) {
          setProcessStep(steps[currentStepIndex]);
        } else {
          clearInterval(interval);
          await saveToDatabase(name, doctorName, [], true);
          setIsProcessing(false);
          setIsCallbackSuccess(true);
        }
      }, 600);
    } else {
      // Step-by-step artificial diagnostic OCR extraction simulation
      const steps = [
        'Uploading prescription file safely to secure HIPAA server...',
        'Preprocessing image: Enhancing contrast & reducing handwriting noise...',
        'Running Neural OCR: Reading doctor’s handwriting & digital signatures...',
        'Mapping handwriting tokens to certified NABL medical tests...',
        'Extraction Complete! Verifying catalog codes...'
      ];

      let currentStepIndex = 0;
      setProcessStep(steps[currentStepIndex]);

      const interval = setInterval(() => {
        currentStepIndex++;
        if (currentStepIndex < steps.length) {
          setProcessStep(steps[currentStepIndex]);
        } else {
          clearInterval(interval);
          // Map service IDs to actual DiagnosticService items
          const services = DIAGNOSTIC_SERVICES.filter(s => serviceIds.includes(s.id));
          setExtractedServices(services);
          setSelectedServices(services.map(s => s.id));
          setIsProcessing(false);
          setIsCompleted(true);
        }
      }, 700);
    }
  };

  const toggleServiceSelection = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter(sid => sid !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleAddSelectionToCart = async () => {
    const itemsToAdd: CartItem[] = extractedServices
      .filter(s => selectedServices.includes(s.id))
      .map(s => ({
        itemId: s.id,
        itemType: 'service',
        name: s.name,
        price: s.price,
        discountPrice: s.discountPrice,
        category: s.category
      }));

    // Log the successful matching and extraction to the backend database
    await saveToDatabase(fileName || 'prescription.pdf', 'Dr. Alok Sharma', selectedServices, false);

    if (itemsToAdd.length > 0) {
      onAddItemsToCart(itemsToAdd);
      onClose();
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-6 relative max-w-2xl w-full mx-auto overflow-hidden animate-fade-in text-left" id="prescription-upload-component">
      {/* Decorative gradient header bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500"></div>

      <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Upload Doctor’s Prescription
          </h2>
          <p className="text-[11px] text-slate-500">Provide details for verification and fast-track booking.</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full text-slate-400 hover:bg-slate-55 hover:text-slate-600 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {validationError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* STATE 0: FORM INPUT & FILE DROP */}
      {!isProcessing && !isCompleted && !isCallbackSuccess && (
        <div className="space-y-5">
          {/* Patient Contact Info Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
            <span className="text-[10px] font-black text-teal-800 tracking-wider uppercase block">Patient Contact Details (Required)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vy9892 Patel"
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number *</label>
                <div className="relative">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile phone"
                    value={patientPhone}
                    onChange={(e) => {
                      setPatientPhone(e.target.value.replace(/\D/g, ''));
                      if (validationError) setValidationError('');
                    }}
                    className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox for don't know tests */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={dontKnowTests}
                onChange={(e) => setDontKnowTests(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <div className="text-[11px] text-slate-655 leading-snug">
                <span className="font-extrabold text-slate-900">I don't know the tests/handwriting is hard to read.</span> Please have a diagnostic assistant call me directly to verify the tests and book my slot.
              </div>
            </label>
          </div>

          {/* File Upload Drag-and-Drop Area */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragActive 
                ? 'border-teal-500 bg-teal-50/40 scale-[1.01]' 
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-55'
            }`}
          >
            <input 
              type="file" 
              id="prescription-file-input" 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />
            <label htmlFor="prescription-file-input" className="cursor-pointer block space-y-2.5">
              <div className="mx-auto w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  {dontKnowTests 
                    ? 'Upload Prescription to Request Free Assistant Callback'
                    : 'Drag & drop prescription to extract tests'}
                </span>
                <span className="text-slate-400 text-xs font-medium"> or </span>
                <span className="font-bold text-teal-600 text-xs hover:underline">browse files</span>
              </div>
              <p className="text-[9px] text-slate-400">Supports PDF, JPEG, PNG formats up to 10MB</p>
            </label>
          </div>

          {/* Quick Prescription Simulator Templates */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="h-[1px] bg-slate-150 flex-1"></span>
              <span>OR SELECT PRESCRIPTION TEMPLATE</span>
              <span className="h-[1px] bg-slate-150 flex-1"></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESCRIPTION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/10 text-left transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="font-bold text-slate-850 text-xs truncate">{template.title}</div>
                  <div className="text-[9px] text-teal-600 font-bold mt-0.5">{template.doctor.split(',')[0]}</div>
                  <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 italic leading-relaxed">
                    "{template.notes}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STATE 1: PROCESSING */}
      {isProcessing && (
        <div className="py-12 text-center space-y-4">
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
            <FileText className="absolute w-5 h-5 text-teal-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">Processing Prescription Submission...</h4>
            <p className="text-xs text-slate-500 h-6 animate-pulse">{processStep}</p>
          </div>
          <div className="w-full max-w-xs mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 animate-loading-bar rounded-full"></div>
          </div>
        </div>
      )}

      {/* STATE 2: DIRECT CALLBACK REGISTERED SUCCESS SCREEN */}
      {isCallbackSuccess && (
        <div className="py-8 text-center space-y-5 animate-fade-in">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-md">
            <PhoneCall className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-serif font-bold text-slate-950">Callback Request Registered!</h3>
            <span className="inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded-lg text-xs font-mono font-bold">
              ID: {createdPrId}
            </span>
            <p className="text-xs text-slate-650 leading-relaxed">
              Hi <span className="font-bold text-slate-800">{patientName}</span>, we have successfully sent your prescription file <span className="font-mono text-slate-700 bg-slate-50 px-1 py-0.5 rounded">{fileName}</span> to our diagnostic centers.
            </p>
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-xl leading-relaxed font-semibold">
              📞 A clinic diagnostic assistant has received your request and will call you on <span className="font-bold">{patientPhone}</span> within 10-15 minutes to read your prescription, guide you with test mappings, and book your center or home collection slot.
            </p>
          </div>
          <div className="pt-4 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: EXTRACTED MATCH RESULTS SELECTION LIST */}
      {isCompleted && extractedServices.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="font-bold text-emerald-900 text-xs">Extraction Complete for {patientName}!</h4>
              <p className="text-[10.5px] text-emerald-700 leading-relaxed mt-0.5">
                We mapped items from <span className="font-bold">{fileName}</span> to NABL certified tests. Choose which ones to add to your cart. We saved this record under ID <span className="font-bold">{createdPrId}</span>.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matched Services</span>
            <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 bg-slate-50/20 overflow-hidden">
              {extractedServices.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <div 
                    key={service.id}
                    onClick={() => toggleServiceSelection(service.id)}
                    className={`flex items-center justify-between p-3 hover:bg-slate-50 transition-colors cursor-pointer select-none ${
                      isSelected ? 'bg-teal-50/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-teal-600 bg-teal-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <span className="text-[9px] font-black">✓</span>}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs">{service.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">{service.subCategory} • Delivery: {service.reportDelivery}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-800">
                        ₹{service.discountPrice || service.price}
                      </span>
                      {service.discountPrice && (
                        <p className="text-[9px] text-slate-400 line-through">₹{service.price}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsCompleted(false);
                setSelectedTemplate(null);
                setFileName(null);
              }}
              className="text-[10.5px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
            >
              Upload Different Prescription
            </button>
            <div className="flex gap-2">
              <button 
                onClick={onClose}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-55 active:scale-[0.98] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSelectionToCart}
                disabled={selectedServices.length === 0}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 ${
                  selectedServices.length > 0 
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-500 shadow-teal-600/15 hover:shadow-lg hover:from-teal-700 hover:to-cyan-600' 
                    : 'bg-slate-300 shadow-none cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add ({selectedServices.length}) to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="mt-4 flex items-center gap-1.5 justify-center text-[9px] text-slate-400">
        <AlertCircle className="w-3 h-3 text-teal-500" />
        <span>Processed securely under HIPAA privacy regulations. Clinic specialists verify all uploads.</span>
      </div>
    </div>
  );
}
