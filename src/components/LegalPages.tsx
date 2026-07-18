import React from 'react';
import {
  FileText, ShieldCheck, RotateCcw, Activity, Info,
  PhoneCall, Mail, MapPin, Clock, Building, ArrowRight, Shield
} from 'lucide-react';

export type LegalTab = 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us';

interface LegalPagesProps {
  activeSection: LegalTab;
  onSectionChange: (section: LegalTab) => void;
}

export default function LegalPages({ activeSection, onSectionChange }: LegalPagesProps) {
  const sections = [
    { id: 'about-us', label: 'About Us', icon: Info },
    { id: 'contact-us', label: 'Contact Us', icon: PhoneCall },
    { id: 'terms-of-use', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'refund-policy', label: 'Refund & Cancellation', icon: RotateCcw },
    { id: 'shipping-policy', label: 'Service Delivery Policy', icon: Activity },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-left animate-fade-in" id="legal-compliance-root">
      <div className="text-center space-y-2 mb-10 border-b border-slate-100 pb-6">
        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
          Compliance & Legal Information
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">
          AssurX <span className="italic font-medium text-emerald-800">Support Center</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto">
          Official policies, guidelines, refund procedures, delivery standards, and corporate contact coordinates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT NAVIGATION: SIDEBAR FOR DESKTOP / ROW FOR MOBILE */}
        <aside className="lg:col-span-3 space-y-2">
          {/* Mobile horizontal scroll container */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-2 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => onSectionChange(sec.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer w-auto lg:w-full ${isActive
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT CONTENT CONTAINER */}
        <main className="lg:col-span-9 bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm min-h-[500px]">
          {/* ABOUT US VIEW */}
          {activeSection === 'about-us' && (
            <div className="space-y-6 animate-fade-in" id="legal-about-us">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Info className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">About Us</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Who We Are & Our Mission</p>
                </div>
              </div>

              <div className="text-slate-600 text-xs md:text-sm leading-relaxed space-y-4">
                <p className="font-bold text-slate-800">
                  Welcome to AssurX Scans & Laboratories!
                </p>
                <p>
                  <strong>AssurX Scans & Laboratories Pvt. Ltd.</strong> is India’s premier diagnostics and advanced medical imaging network. Bridging clinical expertise with futuristic diagnostic technology, we make high-end MRI, CT scans, and complete laboratory blood analyses affordable and accessible for every citizen.
                </p>
                <p>
                  Our network operates state-of-the-art centralized scanning facilities and sterile laboratory infrastructure equipped with fully automated robotic machines. This allows us to reduce processing times, eliminate manual errors, and provide hospital-grade clinical results.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Clinical Excellence</span>
                    <p className="text-[11px] leading-snug">
                      All pathology blood samples are processed in NABL-audited laboratories following strict ISO 15189 protocols.
                    </p>
                  </div>
                  <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Dual-Verified Reports</span>
                    <p className="text-[11px] leading-snug">
                      Every diagnostic scan (MRI, CT, USG) is reviewed and dual-signed by experienced MD Radiologists for absolute confidence.
                    </p>
                  </div>
                </div>

                <h3 className="text-slate-850 font-bold font-serif text-sm mt-6">Our Core Commitment</h3>
                <p>
                  We are committed to putting patients first. By bypassing administrative middlemen and leveraging robotic high-throughput machinery, we pass 100% of our cost savings to the end consumer, offering premium medical services at up to 50% subsidized rates.
                </p>
              </div>
            </div>
          )}

          {/* CONTACT US VIEW */}
          {activeSection === 'contact-us' && (
            <div className="space-y-6 animate-fade-in" id="legal-contact-us">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">Contact Us</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Reach Out to Our Team</p>
                </div>
              </div>

              <div className="text-slate-600 text-xs md:text-sm leading-relaxed space-y-6">
                <p>
                  For any booking queries, report details, home sample collections, billing requests, or support requirements, please feel free to reach out to us using our official coordinates below:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="border border-slate-100 p-5 rounded-2xl flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="w-4.5 h-4.5 text-emerald-700" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Helpline Numbers</span>
                      <a href="tel:18001201100" className="text-slate-850 font-bold block mt-0.5 hover:underline">+91 9830678387  (Toll-Free)</a>
                      <a href="tel:02250117701" className="text-slate-700 text-xs block mt-0.5 hover:underline">022-50117701 (Malad Branch)</a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="border border-slate-100 p-5 rounded-2xl flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4.5 h-4.5 text-emerald-700" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Support</span>
                      <a href="mailto:assurxdiagonistics@gmail.com" className="text-slate-850 font-bold block mt-0.5 hover:underline">assurxdiagonistics@gmail.com</a>
                      <span className="text-slate-500 text-[10px] block mt-0.5">Average response time: 2 hours</span>
                    </div>
                  </div>

                  {/* Registered Office */}
                  <div className="border border-slate-100 p-5 rounded-2xl flex items-start gap-4 md:col-span-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4.5 h-4.5 text-emerald-700" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered & Operational Office Address</span>
                      <p className="text-slate-850 font-bold mt-1 text-xs leading-normal">
                        AssurX Scans & Laboratories Private Limited
                      </p>
                      <p className="text-slate-600 mt-0.5 text-xs">
                        Shop 1-3, SV Road, Opp. Malad Railway Station, Malad West, Mumbai, Maharashtra, India - 400064
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-amber-100 bg-amber-50/20 rounded-2xl p-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">Working Hours</span>
                    <p className="text-slate-600 text-xs mt-1 leading-normal">
                      <strong>Monday to Saturday:</strong> 7:00 AM to 9:00 PM (IST)<br />
                      <strong>Sunday:</strong> 7:00 AM to 1:00 PM (IST)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TERMS & CONDITIONS VIEW */}
          {activeSection === 'terms-of-use' && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm" id="legal-terms-of-use">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">Terms & Conditions</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Standard User Agreements</p>
                </div>
              </div>

              <div className="text-slate-600 leading-relaxed space-y-4">
                <p className="text-[10px] text-slate-400">Last Updated: July 16, 2026</p>
                <p>
                  Please read these Terms and Conditions ("Terms", "Terms of Use") carefully before using the AssurX website (the "Service") operated by <strong>AssurX Scans & Laboratories Pvt. Ltd.</strong> ("us", "we", or "our").
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using our website, booking diagnostic services, or registering an account, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access our services.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">2. Medical Disclaimer</h3>
                <p>
                  The content, scans, and laboratory reports provided by AssurX are for general screening and clinical diagnosis verification purposes. All medical reports must be interpreted and consulted with a qualified registered medical practitioner or doctor. AssurX does not provide prescription medications or clinical treatment courses.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">3. Account & OTP Credentials</h3>
                <p>
                  We offer authentication using mobile numbers, Firebase OTP verification, and email sign-ins. You are solely responsible for maintaining the confidentiality of your credentials and restrict unauthorized access to your diagnostic history and patient files.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">4. Billing & Fees</h3>
                <p>
                  Prices for all imaging scans, blood tests, and health packages are clearly outlined on our website. We reserve the right to modify prices at our discretion. Payment is processed securely through Razorpay gateway integrations or chosen to pay physically at center/lab collection.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">5. Limitation of Liability</h3>
                <p>
                  AssurX utilizes NABL standard machines and dual-reads reports via MD Radiologists. However, biological variance, sample deterioration due to user-side pre-test non-compliance (e.g. failing to fast), or network delays can happen. AssurX's liability is strictly limited to the booking amount paid by the patient for the respective test.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">6. Governing Law</h3>
                <p>
                  These Terms shall be governed and construed in accordance with the laws of India. Any disputes arising in connection with our services will be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra.
                </p>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY VIEW */}
          {activeSection === 'privacy-policy' && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm" id="legal-privacy-policy">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">Privacy Policy</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Data & Health Record Protection</p>
                </div>
              </div>

              <div className="text-slate-600 leading-relaxed space-y-4">
                <p className="text-[10px] text-slate-400">Last Updated: July 16, 2026</p>
                <p>
                  At AssurX, we prioritize patient confidentiality. This Privacy Policy details how we collect, store, and secure your personal, health, and payment information.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">1. Information We Collect</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Personal Coordinates:</strong> Name, age, gender, address, email address, phone number.</li>
                  <li><strong>Clinical Information:</strong> Medical history notes, uploaded handwritten doctor prescriptions, and laboratory/diagnostic scan reports generated by our centers.</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, booking logs, and session identifier logs.</li>
                </ul>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">2. How We Use Your Information</h3>
                <p>
                  We utilize your collected records to schedule phlebotomist home visits, generate diagnostic reports, securely process payment transactions via Razorpay, and communicate reports on email or WhatsApp channels.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">3. Data Sharing Restrictions</h3>
                <p>
                  AssurX strictly enforces clinical secrecy. We **do not sell, rent, or trade** your health data or personal files to third-party advertising companies. Your records are only shared with our clinical staff, phlebotomists, and MD Radiologists specifically tasked with processing your health diagnostics.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">4. Payment Gateway Security</h3>
                <p>
                  All online payments are securely routed through Razorpay. AssurX does not store credit/debit card numbers, CVVs, or online banking passwords on our local databases. All payment requests adhere to PCI-DSS standards.
                </p>

                <h3 className="font-bold text-slate-850 mt-4 text-xs uppercase tracking-wider">5. Your Data Rights</h3>
                <p>
                  You have the right to request access to your booking archives, modify profile inaccuracies, or request account deletions by emailing our customer support care at <a href="mailto:assurxdiagonistics@gmail.com" className="text-emerald-700 hover:underline">assurxdiagonistics@gmail.com</a>.
                </p>
              </div>
            </div>
          )}

          {/* REFUND & CANCELLATION VIEW */}
          {activeSection === 'refund-policy' && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm" id="legal-refund-policy">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">Cancellation & Refund Policy</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Detailed Refund Process</p>
                </div>
              </div>

              <div className="text-slate-600 leading-relaxed space-y-4">
                <p className="text-[10px] text-slate-400">Last Updated: July 16, 2026</p>
                <p>
                  At AssurX, we want our patient experience to be completely hassle-free. If you need to cancel a booking, please review our refund structure:
                </p>

                <h3 className="font-bold text-slate-855 mt-4 text-xs uppercase tracking-wider">1. Cancellation Window</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Before 2 Hours of the Appointment:</strong> Bookings can be cancelled or rescheduled free of charge up to 2 hours prior to the scheduled home collection time slot or center scanning appointment.</li>
                  <li><strong>Late Cancellations (Within 2 Hours):</strong> Cancellations requested within 2 hours of the slot will attract a nominal cancellation/phlebotomist travel charge of ₹150.</li>
                  <li><strong>Post Collection/Test:</strong> No cancellations are permitted once the phlebotomist has collected the sample or after the MRI/CT/Ultrasound scan has been performed.</li>
                </ul>

                <h3 className="font-bold text-slate-855 mt-4 text-xs uppercase tracking-wider">2. Refund Eligibility</h3>
                <p>
                  If you have prepaid online and cancel within the allowed window (more than 2 hours before the appointment), you are eligible for a <strong>100% full refund</strong>.
                </p>

                <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-5 my-4">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>Refund Processing Timeframe</span>
                  </h4>
                  <p className="text-slate-600 mt-2 leading-relaxed text-xs">
                    Approved refunds will be initiated immediately. The refunded money will be credited back to the original source of payment (bank account, credit/debit card, or UPI wallet used via Razorpay) within **5 to 7 business days** in accordance with standard bank timelines.
                  </p>
                </div>

                <h3 className="font-bold text-slate-855 mt-4 text-xs uppercase tracking-wider">3. How to Request a Cancellation</h3>
                <p>
                  To cancel or reschedule a booking, you can:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Go to your <strong>My Bookings</strong> section in the Patient Dashboard and select the cancel option next to your pending appointment.</li>
                  <li>Call our Toll-Free customer support hotline at <a href="tel:18001201100" className="text-emerald-700 font-bold hover:underline">+91 9830678387 </a>.</li>
                  <li>Email your request along with the ASX booking reference ID to <a href="mailto:assurxdiagonistics@gmail.com" className="text-emerald-700 hover:underline">assurxdiagonistics@gmail.com</a>.</li>
                </ul>
              </div>
            </div>
          )}

          {/* SHIPPING & SERVICE DELIVERY POLICY */}
          {activeSection === 'shipping-policy' && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm" id="legal-shipping-policy">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">Service Delivery Policy</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Home Collection & Report Turnaround Policies</p>
                </div>
              </div>

              <div className="text-slate-600 leading-relaxed space-y-4">
                <p className="text-[10px] text-slate-400">Last Updated: July 16, 2026</p>
                <p>
                  Because AssurX offers diagnostic healthcare services, there are no physical packages shipped. Instead, we adhere to strict clinical service delivery protocols:
                </p>

                <h3 className="font-bold text-slate-855 mt-4 text-xs uppercase tracking-wider">1. Home Sample Collection Delivery</h3>
                <p>
                  If you book a blood test or health package with the **Home Collection** option, a certified medical Phlebotomist will visit your specified address. The collection is scheduled strictly within your selected date and time slot. Our Phlebotomist will call to coordinate their arrival approximately 30 minutes before reaching your location.
                </p>

                <h3 className="font-bold text-slate-855 mt-4 text-xs uppercase tracking-wider">2. Diagnostic Center Scans</h3>
                <p>
                  For imaging scans (MRI, CT, Ultrasound, Digital X-Rays), you must visit your selected AssurX Branch (Malad or Goregaon) at the chosen appointment time slot. Please report 15 minutes early to complete check-in requirements and scan preparations.
                </p>

                <h3 className="font-bold text-slate-855 mt-4 text-xs uppercase tracking-wider">3. Online Report Delivery Timeline</h3>
                <p>
                  Our lab processing systems are fully automated. Once certified and signed by medical professionals, reports are shared digitally:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Laboratory Blood & Pathology Tests:</strong> Digital reports will be delivered via SMS/WhatsApp download link and uploaded to your Patient Portal dashboard within **12 to 24 hours** from sample collection.</li>
                  <li><strong>Diagnostic Scans (MRI, CT, X-Ray):</strong> Image reporting is done by MD Radiologists, and signed report PDFs are available within **2 to 6 hours** from the completion of your scan.</li>
                </ul>

                <h3 className="font-bold text-slate-855 mt-4 text-xs uppercase tracking-wider">4. Hard Copy Delivery Options</h3>
                <p>
                  Printed diagnostic reports can be collected directly from the respective Malad or Goregaon branches during operational hours at no extra charge. If you request a hard copy to be dispatched to your home address, a nominal logistics dispatch fee of ₹100 is charged, and report delivery takes 24-48 hours post clinical verification.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
